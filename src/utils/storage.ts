import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, PresensiCatatan, LegerRow, Guru } from '../types/rapor';
import { initialSchoolInfo, initialKelasList, initialMapelList, initialSiswaList, initialSubjectConfigs, generateInitialScores, initialPresensiList, initialGuruList } from './initialData';

const STORAGE_KEYS = {
  INITIALIZED: 'erapor_initialized_flag_v2',
  SCHOOL_INFO: 'erapor_school_info_v1',
  GURU_LIST: 'erapor_guru_list_v1',
  KELAS_LIST: 'erapor_kelas_list_v1',
  MAPEL_LIST: 'erapor_mapel_list_v1',
  SISWA_LIST: 'erapor_siswa_list_v1',
  CONFIG_LIST: 'erapor_config_list_v1',
  SCORES_LIST: 'erapor_scores_list_v1',
  PRESENSI_LIST: 'erapor_presensi_list_v1',
};

export function markAppInitialized(): void {
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function isAppInitialized(): boolean {
  return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
}

export function loadSchoolInfo(): SchoolInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_INFO);
    return raw ? JSON.parse(raw) : initialSchoolInfo;
  } catch {
    return initialSchoolInfo;
  }
}

export function saveSchoolInfo(data: SchoolInfo): void {
  localStorage.setItem(STORAGE_KEYS.SCHOOL_INFO, JSON.stringify(data));
  markAppInitialized();
}

export function loadGuruList(): Guru[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GURU_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialGuruList;
  } catch {
    return isAppInitialized() ? [] : initialGuruList;
  }
}

export function saveGuruList(data: Guru[]): void {
  localStorage.setItem(STORAGE_KEYS.GURU_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadKelasList(): Kelas[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KELAS_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialKelasList;
  } catch {
    return isAppInitialized() ? [] : initialKelasList;
  }
}

export function saveKelasList(data: Kelas[]): void {
  localStorage.setItem(STORAGE_KEYS.KELAS_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadMapelList(): MataPelajaran[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAPEL_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialMapelList;
  } catch {
    return isAppInitialized() ? [] : initialMapelList;
  }
}

export function saveMapelList(data: MataPelajaran[]): void {
  localStorage.setItem(STORAGE_KEYS.MAPEL_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadSiswaList(): Siswa[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SISWA_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialSiswaList;
  } catch {
    return isAppInitialized() ? [] : initialSiswaList;
  }
}

export function saveSiswaList(data: Siswa[]): void {
  localStorage.setItem(STORAGE_KEYS.SISWA_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadSubjectConfigs(): SubjectConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialSubjectConfigs;
  } catch {
    return isAppInitialized() ? [] : initialSubjectConfigs;
  }
}

export function saveSubjectConfigs(data: SubjectConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadScores(): NilaiRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCORES_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : generateInitialScores();
  } catch {
    return isAppInitialized() ? [] : generateInitialScores();
  }
}

export function saveScores(data: NilaiRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.SCORES_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function loadPresensi(): PresensiCatatan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESENSI_LIST);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    return isAppInitialized() ? [] : initialPresensiList;
  } catch {
    return isAppInitialized() ? [] : initialPresensiList;
  }
}

export function savePresensi(data: PresensiCatatan[]): void {
  localStorage.setItem(STORAGE_KEYS.PRESENSI_LIST, JSON.stringify(data));
  markAppInitialized();
}

export function resetAllToDefault(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

// Calculate Legger rows with Ranking
export function calculateLegger(
  kelasId: string,
  siswaList: Siswa[],
  mapelList: MataPelajaran[],
  subjectConfigs: SubjectConfig[],
  scoresList: NilaiRecord[]
): LegerRow[] {
  const kelasSiswa = siswaList.filter((s) => s.kelasId === kelasId);
  const rows: Omit<LegerRow, 'ranking'>[] = [];

  kelasSiswa.forEach((siswa) => {
    const mapelScores: Record<string, number> = {};
    let total = 0;
    let countedMapel = 0;
    let tuntas = 0;
    let belumTuntas = 0;

    mapelList.forEach((mapel) => {
      const rec = scoresList.find((sc) => sc.siswaId === siswa.id && sc.mapelId === mapel.id);
      const conf = subjectConfigs.find((c) => c.kelasId === kelasId && c.mapelId === mapel.id);
      const kktp = conf?.kktp ?? 75;
      const score = rec ? rec.nilaiAkhir : 0;

      mapelScores[mapel.id] = score;
      if (score > 0) {
        total += score;
        countedMapel += 1;
        if (score >= kktp) {
          tuntas += 1;
        } else {
          belumTuntas += 1;
        }
      }
    });

    const rataRata = countedMapel > 0 ? parseFloat((total / countedMapel).toFixed(1)) : 0;

    rows.push({
      siswa,
      nilaiMapel: mapelScores,
      totalNilai: total,
      rataRata,
      jumlahTuntas: tuntas,
      jumlahBelumTuntas: belumTuntas,
    });
  });

  // Calculate ranking based on total score (descending)
  // Create sorted copy
  const sorted = [...rows].sort((a, b) => b.totalNilai - a.totalNilai);
  const rankMap = new Map<string, number>();

  sorted.forEach((item, idx) => {
    // If equal to previous total score, same rank
    if (idx > 0 && item.totalNilai === sorted[idx - 1].totalNilai) {
      rankMap.set(item.siswa.id, rankMap.get(sorted[idx - 1].siswa.id) || idx + 1);
    } else {
      rankMap.set(item.siswa.id, idx + 1);
    }
  });

  return rows.map((r) => ({
    ...r,
    ranking: rankMap.get(r.siswa.id) || 1,
  }));
}
