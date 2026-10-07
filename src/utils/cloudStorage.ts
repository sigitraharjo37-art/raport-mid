import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
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
  initialGuruList,
  initialSiswaList,
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
  markAppInitialized,
} from './storage';

export interface CloudSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

/**
 * Initializes Firestore connection and seeds initial data if cloud is completely empty.
 */
export async function initializeCloudDatabase(): Promise<boolean> {
  try {
    await testFirestoreConnection();
    const schoolDoc = await getDoc(doc(db, 'schoolInfo', 'main'));

    if (!schoolDoc.exists()) {
      // First time ever initialization
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
      markAppInitialized();
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
  await setDoc(doc(db, 'schoolInfo', 'main'), data.schoolInfo);

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
 * When an item is deleted or added on any device, this immediately fires with the accurate updated list!
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

    // 2. Gurus Listener (Syncs additions, edits, and permanent deletions)
    const unsubGurus = onSnapshot(
      collection(db, 'gurus'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Guru);
        saveGuruList(list);
        onDataLoaded({ gurus: list });
      },
      onError
    );
    unsubscribers.push(unsubGurus);

    // 3. Kelas Listener
    const unsubKelas = onSnapshot(
      collection(db, 'kelas'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Kelas);
        saveKelasList(list);
        onDataLoaded({ kelas: list });
      },
      onError
    );
    unsubscribers.push(unsubKelas);

    // 4. Mapel Listener
    const unsubMapel = onSnapshot(
      collection(db, 'mapel'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as MataPelajaran);
        list.sort((a, b) => a.urutan - b.urutan);
        saveMapelList(list);
        onDataLoaded({ mapel: list });
      },
      onError
    );
    unsubscribers.push(unsubMapel);

    // 5. Siswa Listener (Syncs additions, edits, and permanent deletions)
    const unsubSiswa = onSnapshot(
      collection(db, 'siswa'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Siswa);
        saveSiswaList(list);
        onDataLoaded({ siswa: list });
      },
      onError
    );
    unsubscribers.push(unsubSiswa);

    // 6. Subject Configs Listener
    const unsubConfigs = onSnapshot(
      collection(db, 'subjectConfigs'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as SubjectConfig);
        saveSubjectConfigs(list);
        onDataLoaded({ configs: list });
      },
      onError
    );
    unsubscribers.push(unsubConfigs);

    // 7. Scores Listener
    const unsubScores = onSnapshot(
      collection(db, 'scores'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as NilaiRecord);
        saveScores(list);
        onDataLoaded({ scores: list });
      },
      onError
    );
    unsubscribers.push(unsubScores);

    // 8. Presensi Listener
    const unsubPresensi = onSnapshot(
      collection(db, 'presensi'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as PresensiCatatan);
        savePresensi(list);
        onDataLoaded({ presensi: list });
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

// ==================== SAAVERS (CREATE & UPDATE) ====================

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

// ==================== PERMANENT DELETERS (DELETE DOC FROM CLOUD) ====================

/**
 * Permanently deletes a Guru from Firestore and local storage.
 */
export async function deleteGuruCloud(guruId: string) {
  try {
    await deleteDoc(doc(db, 'gurus', guruId));
  } catch (e) {
    console.error('Error deleting guru from cloud:', e);
  }
}

/**
 * Permanently deletes a Siswa from Firestore and removes their scores and presensi from Cloud.
 */
export async function deleteSiswaCloud(siswaId: string) {
  try {
    // 1. Delete student document
    await deleteDoc(doc(db, 'siswa', siswaId));

    // 2. Delete all scores for this student from Firestore
    const scoresSnap = await getDocs(query(collection(db, 'scores'), where('siswaId', '==', siswaId)));
    if (!scoresSnap.empty) {
      const batch = writeBatch(db);
      scoresSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3. Delete presensi for this student from Firestore
    const presensiSnap = await getDocs(collection(db, 'presensi'));
    const presBatch = writeBatch(db);
    let presCount = 0;
    presensiSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.siswaId === siswaId || d.id.endsWith(`_${siswaId}`)) {
        presBatch.delete(d.ref);
        presCount++;
      }
    });
    if (presCount > 0) {
      await presBatch.commit();
    }
  } catch (e) {
    console.error('Error deleting siswa from cloud:', e);
  }
}

/**
 * Permanently deletes multiple Siswa documents, their scores, and presensi from Cloud Firestore.
 */
export async function deleteBatchSiswaCloud(siswaIds: string[]) {
  if (siswaIds.length === 0) return;
  try {
    const siswaIdSet = new Set(siswaIds);

    // 1. Delete student docs in chunks
    const chunkSize = 400;
    for (let i = 0; i < siswaIds.length; i += chunkSize) {
      const chunk = siswaIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, 'siswa', id));
      });
      await batch.commit();
    }

    // 2. Delete all related scores from cloud in chunks
    const scoresSnap = await getDocs(collection(db, 'scores'));
    const scoreDocsToDelete = scoresSnap.docs.filter((d) => siswaIdSet.has(d.data().siswaId));
    for (let i = 0; i < scoreDocsToDelete.length; i += chunkSize) {
      const chunk = scoreDocsToDelete.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3. Delete related presensi from cloud in chunks
    const presensiSnap = await getDocs(collection(db, 'presensi'));
    const presDocsToDelete = presensiSnap.docs.filter((d) => {
      const data = d.data();
      return siswaIdSet.has(data.siswaId);
    });
    for (let i = 0; i < presDocsToDelete.length; i += chunkSize) {
      const chunk = presDocsToDelete.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) {
    console.error('Error deleting batch siswa from cloud:', e);
  }
}

/**
 * Permanently deletes a Kelas from Firestore.
 */
export async function deleteKelasCloud(kelasId: string) {
  try {
    await deleteDoc(doc(db, 'kelas', kelasId));
  } catch (e) {
    console.error('Error deleting kelas from cloud:', e);
  }
}

/**
 * Permanently deletes a Mapel from Firestore.
 */
export async function deleteMapelCloud(mapelId: string) {
  try {
    await deleteDoc(doc(db, 'mapel', mapelId));
  } catch (e) {
    console.error('Error deleting mapel from cloud:', e);
  }
}

/**
 * One-click helper: Permanently purge all initial demo teachers from Cloud and Local.
 */
export async function purgeAllDemoGurusCloud() {
  const demoIds = initialGuruList.map((g) => g.id);
  const batch = writeBatch(db);
  for (const id of demoIds) {
    batch.delete(doc(db, 'gurus', id));
  }
  await batch.commit();
}

/**
 * One-click helper: Permanently purge all initial demo students from Cloud and Local.
 */
export async function purgeAllDemoSiswaCloud() {
  const demoIds = initialSiswaList.map((s) => s.id);
  const batch = writeBatch(db);
  for (const id of demoIds) {
    batch.delete(doc(db, 'siswa', id));
  }
  await batch.commit();

  // Also clean demo scores and presensi
  const scoresSnap = await getDocs(collection(db, 'scores'));
  const scoreBatch = writeBatch(db);
  let sCount = 0;
  scoresSnap.docs.forEach((d) => {
    const sId = d.data().siswaId;
    if (demoIds.includes(sId)) {
      scoreBatch.delete(d.ref);
      sCount++;
    }
  });
  if (sCount > 0) await scoreBatch.commit();

  const presensiSnap = await getDocs(collection(db, 'presensi'));
  const presBatch = writeBatch(db);
  let pCount = 0;
  presensiSnap.docs.forEach((d) => {
    const sId = d.data().siswaId;
    if (demoIds.includes(sId)) {
      presBatch.delete(d.ref);
      pCount++;
    }
  });
  if (pCount > 0) await presBatch.commit();
}
