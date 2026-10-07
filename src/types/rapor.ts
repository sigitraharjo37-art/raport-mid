export interface SchoolInfo {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  semester: 'Ganjil (1)' | 'Genap (2)';
  tahunAjaran: string; // e.g. "2024/2025"
  tempatTanggalRapor: string; // e.g. "Jakarta, 11 Oktober 2024"
  jenisRapor: 'Sumatif Tengah Semester (STS)' | 'Penilaian Tengah Semester (PTS)';
  kurikulum: 'Kurikulum Merdeka' | 'Kurikulum 2013';
  logoSekolah?: string;
  logoKabupaten?: string;
  kopInstansi1?: string; // e.g. "PEMERINTAH KABUPATEN LOMBOK UTARA"
  kopInstansi2?: string; // e.g. "Dinas Pendidikan, Kebudayaan, Pemuda dan Olahraga (Dikbudpora) Kabupaten Lombok Utara"
  tampilkanFormatif?: boolean; // Centang nilai formatif (default true)
  tampilkanSumatif?: boolean; // Centang nilai sumatif (default true)
}

export interface Guru {
  id: string;
  nama: string;
  nip: string;
  jenisKelamin: 'L' | 'P';
  noHp: string;
}

export interface Kelas {
  id: string;
  nama: string; // e.g. "VII-A"
  tingkat: string; // e.g. "7"
  waliKelas: string;
  nipWaliKelas: string;
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  kelompok: 'Kelompok A (Umum)' | 'Kelompok B (Umum)' | 'Kelompok C (Muatan Lokal / Pilihan)';
  urutan: number;
}

export const DAFTAR_AGAMA = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
] as const;

export type Agama = (typeof DAFTAR_AGAMA)[number];

export interface SubjectConfig {
  kelasId: string;
  mapelId: string;
  namaGuru: string;
  kktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran / KKM
  bobotFormatif: number; // default 50
  bobotSumatif: number; // default 50
  deskripsiMapel?: string; // Deskripsi Lingkup Materi / Tujuan Pembelajaran STS
  deskripsiTuntas?: string; // Template deskripsi untuk siswa yang mencapai KKTP
  deskripsiRemedial?: string; // Template deskripsi untuk siswa yang perlu bimbingan
  deskripsiPerAgama?: Record<string, string>; // Deskripsi materi / TP per agama (Islam, Kristen, dsb.)
}

export interface Siswa {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  agama?: string; // Agama siswa: Islam, Kristen, Katolik, Hindu, Buddha, Konghucu
  kelasId: string;
}

export interface NilaiRecord {
  id: string;
  siswaId: string;
  mapelId: string;
  kelasId: string;
  nilaiFormatif: number; // Tugas / TP / Harian
  nilaiSumatif: number; // STS / PTS
  nilaiAkhir: number; // Nilai Rapor
  capaianKompetensi: string; // Deskripsi capaian
}

export interface PresensiCatatan {
  siswaId: string;
  kelasId: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWaliKelas: string;
}

export interface LegerRow {
  siswa: Siswa;
  nilaiMapel: Record<string, number>; // mapelId -> nilaiAkhir
  totalNilai: number;
  rataRata: number;
  ranking: number;
  jumlahTuntas: number;
  jumlahBelumTuntas: number;
}

export interface AuthUser {
  username: string;
  role: 'admin' | 'guru';
  nama: string;
  guruId?: string;
  noHp?: string;
}
