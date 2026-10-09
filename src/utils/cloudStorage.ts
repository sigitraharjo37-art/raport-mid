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
 * Guarded to run only once per device to conserve read quota.
 */
export async function initializeCloudDatabase(): Promise<boolean> {
  const initKey = 'erapor_cloud_initialized_guard_v3';
  if (localStorage.getItem(initKey) === 'true') {
    return true;
  }

  try {
    await testFirestoreConnection();

    // Ensure school info exists in cloud
    try {
      const schoolDoc = await getDoc(doc(db, 'schoolInfo', 'main'));
      if (!schoolDoc.exists()) {
        await saveSchoolInfoCloud(loadSchoolInfo());
      }
    } catch (e) {
      console.warn('School info cloud check skipped:', e);
    }

    localStorage.setItem(initKey, 'true');
    markAppInitialized();
    return true;
  } catch (err: any) {
    console.warn('Cloud database init status (local storage active):', err);
    markAppInitialized();
    return false;
  }
}

function cleanDocForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined && !(typeof val === 'number' && Number.isNaN(val))) {
      result[key] = val;
    }
  });
  return result;
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
        const cleanedItem = cleanDocForFirestore(item);
        batch.set(doc(db, colName, id), cleanedItem);
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
 * Mode Super Hemat Kuota Firestore (Ultra-Economical Mode):
 * 1. Read Cloud Firestore hanya saat baru membuka halaman atau me-refresh halaman (atau tombol sinkron manual).
 * 2. Tidak menggunakan continuous onSnapshot listeners latar belakang agar tidak menguras kuota 50.000 read/hari dan mencegah LOOP.
 * 3. Write ke Cloud Firestore hanya saat user menekan tombol 'Simpan'.
 */
export async function fetchCloudDataOnce(
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
): Promise<{ success: boolean; isQuotaExceeded?: boolean; error?: string }> {
  try {
    // 1. School Info (1 read)
    try {
      const schoolSnap = await getDoc(doc(db, 'schoolInfo', 'main'));
      if (schoolSnap.exists()) {
        const info = schoolSnap.data() as SchoolInfo;
        saveSchoolInfo(info);
        onDataLoaded({ schoolInfo: info });
      }
    } catch (e: any) {
      console.warn('School info fetch notice (local preserved):', e);
    }

    // 2. Gurus
    try {
      const gurusSnap = await getDocs(collection(db, 'gurus'));
      if (!gurusSnap.empty) {
        const list = gurusSnap.docs.map((d) => d.data() as Guru);
        saveGuruList(list);
        onDataLoaded({ gurus: list });
      }
    } catch (e: any) {
      console.warn('Gurus fetch notice (local preserved):', e);
    }

    // 3. Kelas
    try {
      const kelasSnap = await getDocs(collection(db, 'kelas'));
      if (!kelasSnap.empty) {
        const list = kelasSnap.docs.map((d) => d.data() as Kelas);
        saveKelasList(list);
        onDataLoaded({ kelas: list });
      }
    } catch (e: any) {
      console.warn('Kelas fetch notice (local preserved):', e);
    }

    // 4. Mapel (Urutkan berdasarkan urutan) - 1 doc per mapel
    try {
      const mapelSnap = await getDocs(collection(db, 'mapel'));
      if (!mapelSnap.empty) {
        const list = mapelSnap.docs.map((d) => d.data() as MataPelajaran);
        list.sort((a, b) => a.urutan - b.urutan);
        saveMapelList(list);
        onDataLoaded({ mapel: list });
      }
    } catch (e: any) {
      console.warn('Mapel fetch notice (local preserved):', e);
    }

    // 5. Siswa
    try {
      const siswaSnap = await getDocs(collection(db, 'siswa'));
      if (!siswaSnap.empty) {
        const list = siswaSnap.docs.map((d) => d.data() as Siswa);
        saveSiswaList(list);
        onDataLoaded({ siswa: list });
      }
    } catch (e: any) {
      console.warn('Siswa fetch notice (local preserved):', e);
    }

    // 6. Subject Configs
    try {
      const configsSnap = await getDocs(collection(db, 'subjectConfigs'));
      if (!configsSnap.empty) {
        const cloudConfigs = configsSnap.docs.map((d) => d.data() as SubjectConfig);
        const localConfigs = loadSubjectConfigs();
        const confMap = new Map<string, SubjectConfig>();
        localConfigs.forEach((c) => confMap.set(`${c.kelasId}_${c.mapelId}`, c));
        cloudConfigs.forEach((c) => confMap.set(`${c.kelasId}_${c.mapelId}`, c));
        const mergedConfigs = Array.from(confMap.values());
        saveSubjectConfigs(mergedConfigs);
        onDataLoaded({ configs: mergedConfigs });
      }
    } catch (e: any) {
      console.warn('Configs fetch notice (local preserved):', e);
    }

    // 7. Scores (Mendukung format hemat 1-write per kelas-mapel dan legacy single records)
    try {
      const scoresSnap = await getDocs(collection(db, 'scores'));
      if (!scoresSnap.empty) {
        const incomingScores: NilaiRecord[] = [];
        const incomingConfigs: SubjectConfig[] = [];

        scoresSnap.docs.forEach((d) => {
          const data = d.data();
          if (Array.isArray(data.scores)) {
            incomingScores.push(...data.scores);
            if (data.config) {
              incomingConfigs.push(data.config as SubjectConfig);
            }
          } else if (data.siswaId && data.mapelId) {
            incomingScores.push({ id: d.id, ...data } as NilaiRecord);
          }
        });

        const localScores = loadScores();
        const scoreMap = new Map<string, NilaiRecord>();
        localScores.forEach((sc) => {
          scoreMap.set(`${sc.siswaId}_${sc.mapelId}`, sc);
        });
        incomingScores.forEach((sc) => {
          scoreMap.set(`${sc.siswaId}_${sc.mapelId}`, sc);
        });
        const mergedScores = Array.from(scoreMap.values());
        saveScores(mergedScores);

        if (incomingConfigs.length > 0) {
          const localConfigs = loadSubjectConfigs();
          const confMap = new Map<string, SubjectConfig>();
          localConfigs.forEach((c) => confMap.set(`${c.kelasId}_${c.mapelId}`, c));
          incomingConfigs.forEach((c) => confMap.set(`${c.kelasId}_${c.mapelId}`, c));
          const mergedConfigs = Array.from(confMap.values());
          saveSubjectConfigs(mergedConfigs);
          onDataLoaded({ scores: mergedScores, configs: mergedConfigs });
        } else {
          onDataLoaded({ scores: mergedScores });
        }
      }
    } catch (e: any) {
      console.warn('Scores fetch notice (local preserved):', e);
    }

    // 8. Presensi
    try {
      const presensiSnap = await getDocs(collection(db, 'presensi'));
      if (!presensiSnap.empty) {
        const incomingPresensi: PresensiCatatan[] = [];
        presensiSnap.docs.forEach((d) => {
          const data = d.data();
          if (Array.isArray(data.records)) {
            incomingPresensi.push(...data.records);
          } else if (data.siswaId && data.kelasId) {
            incomingPresensi.push(data as PresensiCatatan);
          }
        });

        const localPresensi = loadPresensi();
        const presensiMap = new Map<string, PresensiCatatan>();
        localPresensi.forEach((p) => presensiMap.set(`${p.kelasId}_${p.siswaId}`, p));
        incomingPresensi.forEach((p) => presensiMap.set(`${p.kelasId}_${p.siswaId}`, p));
        const mergedPresensi = Array.from(presensiMap.values());
        savePresensi(mergedPresensi);
        onDataLoaded({ presensi: mergedPresensi });
      }
    } catch (e: any) {
      console.warn('Presensi fetch notice (local preserved):', e);
    }

    return { success: true };
  } catch (err: any) {
    const isQuota =
      err?.message?.includes('RESOURCE_EXHAUSTED') ||
      err?.code === 'resource-exhausted';
    if (onError) onError(err);
    return {
      success: false,
      isQuotaExceeded: isQuota,
      error: isQuota
        ? 'Batas kuota harian Firebase Firestore tercapai. Mode hemat lokal aktif.'
        : err?.message,
    };
  }
}

/**
 * Subscribes or fetches initial Cloud data on page open/refresh.
 * Runs only once per mount/refresh to preserve the 50.000 daily read quota and prevent any write-read loops.
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
  // Execute single read on page open / refresh
  fetchCloudDataOnce(onDataLoaded, onError);

  // Return harmless cleanup function
  return () => {};
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

export async function saveSingleGuruCloud(guru: Guru) {
  try {
    await setDoc(doc(db, 'gurus', guru.id), cleanDocForFirestore(guru));
  } catch (e) {
    console.error('Error saving single guru to cloud:', e);
  }
}

export async function saveGurusCloud(gurus: Guru[]) {
  saveGuruList(gurus);
  try {
    const batch = writeBatch(db);
    gurus.forEach((g) => {
      batch.set(doc(db, 'gurus', g.id), cleanDocForFirestore(g));
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving gurus to cloud:', e);
  }
}

export async function saveSingleKelasCloud(kelas: Kelas) {
  try {
    await setDoc(doc(db, 'kelas', kelas.id), cleanDocForFirestore(kelas));
  } catch (e) {
    console.error('Error saving single kelas to cloud:', e);
  }
}

export async function saveKelasCloud(kelas: Kelas[]) {
  saveKelasList(kelas);
  try {
    const batch = writeBatch(db);
    kelas.forEach((k) => {
      batch.set(doc(db, 'kelas', k.id), cleanDocForFirestore(k));
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving kelas to cloud:', e);
  }
}

export async function saveSingleMapelCloud(mapel: MataPelajaran) {
  try {
    await setDoc(doc(db, 'mapel', mapel.id), cleanDocForFirestore(mapel));
  } catch (e) {
    console.error('Error saving single mapel to cloud:', e);
  }
}

export async function saveMapelCloud(mapel: MataPelajaran[]) {
  saveMapelList(mapel);
  try {
    const batch = writeBatch(db);
    mapel.forEach((m) => {
      batch.set(doc(db, 'mapel', m.id), cleanDocForFirestore(m));
    });
    await batch.commit();
  } catch (e) {
    console.error('Error saving mapel to cloud:', e);
  }
}

export async function saveSingleSiswaCloud(siswa: Siswa) {
  try {
    const cleaned = cleanDocForFirestore({
      ...siswa,
      agama: siswa.agama || 'Islam',
    });
    await setDoc(doc(db, 'siswa', siswa.id), cleaned);
  } catch (e) {
    console.error('Error saving single siswa to cloud:', e);
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
        const cleaned = cleanDocForFirestore({
          ...s,
          agama: s.agama || 'Islam',
        });
        batch.set(doc(db, 'siswa', s.id), cleaned);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error saving siswa to cloud:', e);
  }
}

export async function saveSingleSubjectConfigCloud(config: SubjectConfig) {
  try {
    const cleaned = cleanDocForFirestore({
      ...config,
      deskripsiPerAgama: config.deskripsiPerAgama || {},
      updatedAt: Date.now(),
    });
    await setDoc(doc(db, 'subjectConfigs', `${config.kelasId}_${config.mapelId}`), cleaned);
  } catch (e) {
    console.error('Error saving single subject config to cloud:', e);
  }
}

export async function saveSubjectConfigsCloud(configs: SubjectConfig[]) {
  saveSubjectConfigs(configs);
  try {
    const batch = writeBatch(db);
    configs.forEach((c) => {
      const cleaned = cleanDocForFirestore({
        ...c,
        deskripsiPerAgama: c.deskripsiPerAgama || {},
        updatedAt: Date.now(),
      });
      batch.set(doc(db, 'subjectConfigs', `${c.kelasId}_${c.mapelId}`), cleaned);
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
        batch.set(doc(db, 'scores', id), cleanDocForFirestore(sc));
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error saving scores to cloud:', e);
  }
}

/**
 * Saves and synchronizes scores and subject config for a specific class and subject in a single atomic batch.
 * This is called by "Simpan Semua Nilai" to ensure targeted, high-speed, and reliable synchronization.
 * Does NOT overwrite other classes or other subjects in the cloud database!
 */
export async function saveClassMapelScoresCloud(
  kelasId: string,
  mapelId: string,
  updatedClassScores: NilaiRecord[],
  config: SubjectConfig,
  allUpdatedScores: NilaiRecord[],
  allUpdatedConfigs: SubjectConfig[]
): Promise<{ success: boolean; localOnly?: boolean; syncedCount: number; error?: string }> {
  // 1. Immediately persist full datasets locally
  saveScores(allUpdatedScores);
  saveSubjectConfigs(allUpdatedConfigs);

  try {
    // EXACTLY 1 WRITE: Entire class student scores & subject config bundled into 1 document
    const cleanConfig = cleanDocForFirestore({
      ...config,
      kelasId,
      mapelId,
      deskripsiPerAgama: config.deskripsiPerAgama || {},
      updatedAt: Date.now(),
    });

    const classScoreDoc = cleanDocForFirestore({
      id: `${kelasId}_${mapelId}`,
      kelasId,
      mapelId,
      config: cleanConfig,
      scores: updatedClassScores,
      updatedAt: Date.now(),
    });

    // 1 single write to Firestore:
    await setDoc(doc(db, 'scores', `${kelasId}_${mapelId}`), classScoreDoc);

    return { success: true, syncedCount: updatedClassScores.length };
  } catch (commitErr: any) {
    console.warn('Firestore commit notice (local-first active):', commitErr);
    const isQuota =
      commitErr?.message?.includes('RESOURCE_EXHAUSTED') ||
      commitErr?.code === 'resource-exhausted';
    return {
      success: true,
      localOnly: true,
      syncedCount: updatedClassScores.length,
      error: isQuota
        ? 'Batas kuota harian Firebase Firestore tercapai. Nilai Anda berhasil tersimpan aman di database lokal perangkat ini (mode hemat kuota aktif)!'
        : `Nilai tersimpan di perangkat lokal. Catatan Cloud: ${commitErr?.message || 'Kendala jaringan'}`,
    };
  }
}

/**
 * Saves presensi for ONE specific class in 1 single document write to conserve write quota.
 */
export async function saveClassPresensiCloud(
  kelasId: string,
  classPresensi: PresensiCatatan[],
  allPresensi: PresensiCatatan[]
) {
  savePresensi(allPresensi);
  try {
    // EXACTLY 1 WRITE for the entire class presensi:
    const classPresensiDoc = cleanDocForFirestore({
      id: `class_${kelasId}`,
      kelasId,
      records: classPresensi,
      updatedAt: Date.now(),
    });
    await setDoc(doc(db, 'presensi', `class_${kelasId}`), classPresensiDoc);
  } catch (e) {
    console.warn('Error saving class presensi to cloud (preserved locally):', e);
  }
}

export async function savePresensiCloud(presensi: PresensiCatatan[]) {
  savePresensi(presensi);
  try {
    const batch = writeBatch(db);
    presensi.forEach((p) => {
      batch.set(doc(db, 'presensi', `${p.kelasId}_${p.siswaId}`), cleanDocForFirestore({
        ...p,
        updatedAt: Date.now(),
      }));
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
