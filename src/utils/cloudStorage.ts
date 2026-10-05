import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';
import {
  SchoolInfo,
  Guru,
  Kelas,
  MataPelajaran,
  Siswa,
  SubjectConfig,
  NilaiRecord,
  PresensiCatatan,
} from '../types/rapor';
import {
  initialSchoolInfo,
  initialGuruList,
  initialKelasList,
  initialMapelList,
  initialSiswaList,
  initialSubjectConfigs,
  generateInitialScores,
  initialPresensiList,
} from './initialData';
import {
  loadSchoolInfo,
  loadGuruList,
  loadKelasList,
  loadMapelList,
  loadSiswaList,
  loadSubjectConfigs,
  loadScores,
  loadPresensi,
  saveSchoolInfo,
  saveGuruList,
  saveKelasList,
  saveMapelList,
  saveSiswaList,
  saveSubjectConfigs,
  saveScores,
  savePresensi,
} from './storage';

export interface CloudSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

/**
 * Initializes Firestore connection and seeds initial data if cloud is empty.
 */
export async function initializeCloudDatabase(): Promise<boolean> {
  try {
    await testFirestoreConnection();
    const schoolDoc = await getDoc(doc(db, 'schoolInfo', 'main'));

    if (!schoolDoc.exists()) {
      // First time initialization: seed from localStorage or initialData
      const currentSchool = loadSchoolInfo();
      const currentGurus = loadGuruList();
      const currentKelas = loadKelasList();
      const currentMapel = loadMapelList();
      const currentSiswa = loadSiswaList();
      const currentConfigs = loadSubjectConfigs();
      const currentScores = loadScores();
      const currentPresensi = loadPresensi();

      await syncAllToCloud({
        schoolInfo: currentSchool,
        gurus: currentGurus,
        kelas: currentKelas,
        mapel: currentMapel,
        siswa: currentSiswa,
        configs: currentConfigs,
        scores: currentScores,
        presensi: currentPresensi,
      });
    }
    return true;
  } catch (err: any) {
    console.error('Failed to initialize cloud database:', err);
    return false;
  }
}

/**
 * Syncs everything to Firestore
 */
export async function syncAllToCloud(data: {
  schoolInfo: SchoolInfo;
  gurus: Guru[];
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  configs: SubjectConfig[];
  scores: NilaiRecord[];
  presensi: PresensiCatatan[];
}) {
  // Save school info
  await setDoc(doc(db, 'schoolInfo', 'main'), data.schoolInfo);

  // Helper for batch saving items
  const saveBatchItems = async (colName: string, items: any[], getId: (item: any, idx: number) => string) => {
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item, idx) => {
        const id = getId(item, i + idx);
        batch.set(doc(db, colName, id), item);
      });
      await batch.commit();
    }
  };

  await saveBatchItems('gurus', data.gurus, (g) => g.id);
  await saveBatchItems('kelas', data.kelas, (k) => k.id);
  await saveBatchItems('mapel', data.mapel, (m) => m.id);
  await saveBatchItems('siswa', data.siswa, (s) => s.id);
  await saveBatchItems('subjectConfigs', data.configs, (c) => `${c.kelasId}_${c.mapelId}`);
  await saveBatchItems('scores', data.scores, (sc) => sc.id || `nr-${sc.siswaId}-${sc.mapelId}`);
  await saveBatchItems('presensi', data.presensi, (p) => `${p.kelasId}_${p.siswaId}`);
}

/**
 * Subscribes to Real-Time Updates from Cloud Database.
 * When data is changed by another teacher / device, this immediately fires!
 */
export function subscribeToRealtimeCloudData(
  onDataLoaded: (data: {
    schoolInfo?: SchoolInfo;
    gurus?: Guru[];
    kelas?: Kelas[];
    mapel?: MataPelajaran[];
    siswa?: Siswa[];
    configs?: SubjectConfig[];
    scores?: NilaiRecord[];
    presensi?: PresensiCatatan[];
  }) => void,
  onError?: (err: Error) => void
) {
  const unsubscribers: (() => void)[] = [];

  try {
    // 1. School Info Listener
    const unsubSchool = onSnapshot(
      doc(db, 'schoolInfo', 'main'),
      (snapshot) => {
        if (snapshot.exists()) {
          const info = snapshot.data() as SchoolInfo;
          saveSchoolInfo(info);
          onDataLoaded({ schoolInfo: info });
        }
      },
      onError
    );
    unsubscribers.push(unsubSchool);

    // 2. Gurus Listener
    const unsubGurus = onSnapshot(
      collection(db, 'gurus'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Guru);
          saveGuruList(list);
          onDataLoaded({ gurus: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubGurus);

    // 3. Kelas Listener
    const unsubKelas = onSnapshot(
      collection(db, 'kelas'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Kelas);
          saveKelasList(list);
          onDataLoaded({ kelas: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubKelas);

    // 4. Mapel Listener
    const unsubMapel = onSnapshot(
      collection(db, 'mapel'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as MataPelajaran);
          list.sort((a, b) => a.urutan - b.urutan);
          saveMapelList(list);
          onDataLoaded({ mapel: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubMapel);

    // 5. Siswa Listener
    const unsubSiswa = onSnapshot(
      collection(db, 'siswa'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Siswa);
          saveSiswaList(list);
          onDataLoaded({ siswa: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubSiswa);

    // 6. Subject Configs Listener
    const unsubConfigs = onSnapshot(
      collection(db, 'subjectConfigs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as SubjectConfig);
          saveSubjectConfigs(list);
          onDataLoaded({ configs: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubConfigs);

    // 7. Scores Listener
    const unsubScores = onSnapshot(
      collection(db, 'scores'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as NilaiRecord);
          saveScores(list);
          onDataLoaded({ scores: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubScores);

    // 8. Presensi Listener
    const unsubPresensi = onSnapshot(
      collection(db, 'presensi'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as PresensiCatatan);
          savePresensi(list);
          onDataLoaded({ presensi: list });
        }
      },
      onError
    );
    unsubscribers.push(unsubPresensi);
  } catch (err: any) {
    if (onError) onError(err);
  }

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

// Individual entity savers
export async function saveSchoolInfoCloud(info: SchoolInfo) {
  saveSchoolInfo(info);
  try {
    await setDoc(doc(db, 'schoolInfo', 'main'), info);
  } catch (e) {
    console.error('Error saving school info to cloud:', e);
  }
}

export async function saveGurusCloud(gurus: Guru[]) {
  saveGuruList(gurus);
  try {
    const batch = writeBatch(db);
    gurus.forEach((g) => {
      batch.set(doc(db, 'gurus', g.id), g);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving gurus to cloud:', e);
  }
}

export async function saveKelasCloud(kelas: Kelas[]) {
  saveKelasList(kelas);
  try {
    const batch = writeBatch(db);
    kelas.forEach((k) => {
      batch.set(doc(db, 'kelas', k.id), k);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving kelas to cloud:', e);
  }
}

export async function saveMapelCloud(mapel: MataPelajaran[]) {
  saveMapelList(mapel);
  try {
    const batch = writeBatch(db);
    mapel.forEach((m) => {
      batch.set(doc(db, 'mapel', m.id), m);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving mapel to cloud:', e);
  }
}

export async function saveSiswaCloud(siswa: Siswa[]) {
  saveSiswaList(siswa);
  try {
    const chunkSize = 400;
    for (let i = 0; i < siswa.length; i += chunkSize) {
      const chunk = siswa.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((s) => {
        batch.set(doc(db, 'siswa', s.id), s);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error saving siswa to cloud:', e);
  }
}

export async function saveSubjectConfigsCloud(configs: SubjectConfig[]) {
  saveSubjectConfigs(configs);
  try {
    const batch = writeBatch(db);
    configs.forEach((c) => {
      batch.set(doc(db, 'subjectConfigs', `${c.kelasId}_${c.mapelId}`), c);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving configs to cloud:', e);
  }
}

export async function saveScoresCloud(scores: NilaiRecord[]) {
  saveScores(scores);
  try {
    const chunkSize = 400;
    for (let i = 0; i < scores.length; i += chunkSize) {
      const chunk = scores.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((sc) => {
        const id = sc.id || `nr-${sc.siswaId}-${sc.mapelId}`;
        batch.set(doc(db, 'scores', id), sc);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error saving scores to cloud:', e);
  }
}

export async function savePresensiCloud(presensi: PresensiCatatan[]) {
  savePresensi(presensi);
  try {
    const batch = writeBatch(db);
    presensi.forEach((p) => {
      batch.set(doc(db, 'presensi', `${p.kelasId}_${p.siswaId}`), p);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving presensi to cloud:', e);
  }
}
