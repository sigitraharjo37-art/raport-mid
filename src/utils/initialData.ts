import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, PresensiCatatan, Guru } from '../types/rapor';

export const initialGuruList: Guru[] = [
  { id: 'g-1', nama: 'Hj. Endang Suryani, S.Pd.', nip: '19790422 200501 2 008', jenisKelamin: 'P', noHp: '0812-3456-7801' },
  { id: 'g-2', nama: 'Drs. Supriyanto, M.M.', nip: '19730811 199903 1 004', jenisKelamin: 'L', noHp: '0812-3456-7802' },
  { id: 'g-3', nama: 'Rina Kusuma Dewi, S.Pd., M.Hum.', nip: '19850217 200902 2 003', jenisKelamin: 'P', noHp: '0812-3456-7803' },
  { id: 'g-4', nama: 'Drs. H. Mulyadi, M.A.', nip: '19690115 199403 1 002', jenisKelamin: 'L', noHp: '0813-8899-1004' },
  { id: 'g-5', nama: 'Budi Santoso, S.Pd.', nip: '19810310 200604 1 009', jenisKelamin: 'L', noHp: '0812-9988-7705' },
  { id: 'g-6', nama: 'Ahmad Fauzi, M.Pd.', nip: '19800612 200501 1 012', jenisKelamin: 'L', noHp: '0857-1122-3306' },
  { id: 'g-7', nama: 'Dra. Sri Wahyuni', nip: '19710920 199702 2 001', jenisKelamin: 'P', noHp: '0813-4455-6607' },
  { id: 'g-8', nama: 'Nanang Kosasih, S.Pd.', nip: '19830504 200801 1 015', jenisKelamin: 'L', noHp: '0818-7766-5508' },
  { id: 'g-9', nama: 'Maria Goretti, S.Pd., M.Ed.', nip: '19841122 200903 2 006', jenisKelamin: 'P', noHp: '0856-2233-4409' },
  { id: 'g-10', nama: 'Tri Wahyudi, S.Or.', nip: '19880214 201101 1 007', jenisKelamin: 'L', noHp: '0812-5566-7710' },
  { id: 'g-11', nama: 'Rahmat Hidayat, S.Kom.', nip: '19900418 201503 1 003', jenisKelamin: 'L', noHp: '0878-9900-1111' },
  { id: 'g-12', nama: 'Ratna Megasari, S.Sn.', nip: '19870825 201001 2 014', jenisKelamin: 'P', noHp: '0813-7788-9912' },
  { id: 'g-13', nama: 'Ki Sudarsono, S.Pd.', nip: '19760719 200312 1 005', jenisKelamin: 'L', noHp: '0812-6655-4413' },
];

export const initialSchoolInfo: SchoolInfo = {
  namaSekolah: 'SMP NEGERI 1 CEMERLANG',
  npsn: '20108742',
  alamat: 'Jl. Merdeka Belajar No. 12, Kel. Menteng',
  kelurahan: 'Menteng',
  kecamatan: 'Menteng',
  kabupatenKota: 'Kota Jakarta Pusat',
  provinsi: 'DKI Jakarta',
  kodePos: '10310',
  telepon: '(021) 3901234',
  email: 'smpn1cemerlang@edu.go.id',
  website: 'https://smpn1cemerlang.sch.id',
  namaKepalaSekolah: 'Dr. H. Hendra Wijaya, M.Pd.',
  nipKepalaSekolah: '19680514 199203 1 005',
  semester: 'Ganjil (1)',
  tahunAjaran: '2024/2025',
  tempatTanggalRapor: 'Jakarta, 11 Oktober 2024',
  jenisRapor: 'Sumatif Tengah Semester (STS)',
  kurikulum: 'Kurikulum Merdeka',
  tampilkanFormatif: true,
  tampilkanSumatif: true,
};

export const initialKelasList: Kelas[] = [
  {
    id: 'k-7a',
    nama: 'VII-A',
    tingkat: '7',
    waliKelas: 'Hj. Endang Suryani, S.Pd.',
    nipWaliKelas: '19790422 200501 2 008',
  },
  {
    id: 'k-7b',
    nama: 'VII-B',
    tingkat: '7',
    waliKelas: 'Drs. Supriyanto, M.M.',
    nipWaliKelas: '19730811 199903 1 004',
  },
  {
    id: 'k-8a',
    nama: 'VIII-A',
    tingkat: '8',
    waliKelas: 'Rina Kusuma Dewi, S.Pd., M.Hum.',
    nipWaliKelas: '19850217 200902 2 003',
  },
];

export const initialMapelList: MataPelajaran[] = [
  {
    id: 'm-pai',
    kode: 'PAIBP',
    nama: 'Pendidikan Agama & Budi Pekerti',
    kelompok: 'Kelompok A (Umum)',
    urutan: 1,
  },
  {
    id: 'm-ppkn',
    kode: 'PPKn',
    nama: 'Pendidikan Pancasila',
    kelompok: 'Kelompok A (Umum)',
    urutan: 2,
  },
  {
    id: 'm-bind',
    kode: 'BIND',
    nama: 'Bahasa Indonesia',
    kelompok: 'Kelompok A (Umum)',
    urutan: 3,
  },
  {
    id: 'm-mtk',
    kode: 'MTK',
    nama: 'Matematika',
    kelompok: 'Kelompok A (Umum)',
    urutan: 4,
  },
  {
    id: 'm-ipa',
    kode: 'IPA',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kelompok: 'Kelompok A (Umum)',
    urutan: 5,
  },
  {
    id: 'm-ips',
    kode: 'IPS',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kelompok: 'Kelompok A (Umum)',
    urutan: 6,
  },
  {
    id: 'm-bing',
    kode: 'BING',
    nama: 'Bahasa Inggris',
    kelompok: 'Kelompok A (Umum)',
    urutan: 7,
  },
  {
    id: 'm-pjok',
    kode: 'PJOK',
    nama: 'Pendidikan Jasmani, Olahraga & Kesehatan',
    kelompok: 'Kelompok B (Umum)',
    urutan: 8,
  },
  {
    id: 'm-infor',
    kode: 'INF',
    nama: 'Informatika',
    kelompok: 'Kelompok B (Umum)',
    urutan: 9,
  },
  {
    id: 'm-seni',
    kode: 'SNB',
    nama: 'Seni dan Budaya (Seni Rupa)',
    kelompok: 'Kelompok B (Umum)',
    urutan: 10,
  },
  {
    id: 'm-mulok',
    kode: 'MLK',
    nama: 'Muatan Lokal (Bahasa Daerah)',
    kelompok: 'Kelompok C (Muatan Lokal / Pilihan)',
    urutan: 11,
  },
];

export const initialSiswaList: Siswa[] = [
  { id: 's-1', nis: '240701', nisn: '0098451201', nama: 'Aditya Pratama Ramadhan', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-2', nis: '240702', nisn: '0098451202', nama: 'Anisa Citra Lestari', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-3', nis: '240703', nisn: '0098451203', nama: 'Bagas Satria Wibowo', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-4', nis: '240704', nisn: '0098451204', nama: 'Chelsea Aurelia Putri', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-5', nis: '240705', nisn: '0098451205', nama: 'Dimas Arya Nugroho', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-6', nis: '240706', nisn: '0098451206', nama: 'Fadhil Muhammad Ridwan', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-7', nis: '240707', nisn: '0098451207', nama: 'Gisella Natasha', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-8', nis: '240708', nisn: '0098451208', nama: 'Haikal Zikri Ilham', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-9', nis: '240709', nisn: '0098451209', nama: 'Intan Nuraini', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-10', nis: '240710', nisn: '0098451210', nama: 'Kevin Jonathan Sihombing', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-11', nis: '240711', nisn: '0098451211', nama: 'Larasati Dewi', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-12', nis: '240712', nisn: '0098451212', nama: 'Muhammad Rizky Alfian', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-13', nis: '240713', nisn: '0098451213', nama: 'Nabila Zahra Khairunnisa', jenisKelamin: 'P', kelasId: 'k-7a' },
  { id: 's-14', nis: '240714', nisn: '0098451214', nama: 'Rafi Al Ghifari', jenisKelamin: 'L', kelasId: 'k-7a' },
  { id: 's-15', nis: '240715', nisn: '0098451215', nama: 'Zahra Amelia Santoso', jenisKelamin: 'P', kelasId: 'k-7a' },
];

export const initialSubjectConfigs: SubjectConfig[] = [
  { kelasId: 'k-7a', mapelId: 'm-pai', namaGuru: 'Drs. H. Mulyadi, M.A.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Memahami hakikat beriman kepada kitab-kitab Allah serta meneladani perilaku jujur dan amanah.' },
  { kelasId: 'k-7a', mapelId: 'm-ppkn', namaGuru: 'Budi Santoso, S.Pd.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Menganalisis perumusan dan penetapan Pancasila sebagai dasar negara serta norma dalam masyarakat.' },
  { kelasId: 'k-7a', mapelId: 'm-bind', namaGuru: 'Hj. Endang Suryani, S.Pd.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Memahami ide pokok teks deskripsi dan menyajikan teks cerita fantasi dengan struktur yang runtut.' },
  { kelasId: 'k-7a', mapelId: 'm-mtk', namaGuru: 'Ahmad Fauzi, M.Pd.', kktp: 72, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Menyelesaikan operasi hitung bilangan bulat, pecahan, dan penyederhanaan bentuk aljabar.' },
  { kelasId: 'k-7a', mapelId: 'm-ipa', namaGuru: 'Dra. Sri Wahyuni', kktp: 73, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Memahami pengukuran besaran dan satuan serta klasifikasi makhluk hidup dan benda tak hidup.' },
  { kelasId: 'k-7a', mapelId: 'm-ips', namaGuru: 'Nanang Kosasih, S.Pd.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Menganalisis letak geografis Indonesia dan interaksi antarruang dalam pemenuhan kebutuhan manusia.' },
  { kelasId: 'k-7a', mapelId: 'm-bing', namaGuru: 'Maria Goretti, S.Pd., M.Ed.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Mampu memperkenalkan diri (self introduction), menyapa (greetings), dan mengidentifikasi teks perkenalan.' },
  { kelasId: 'k-7a', mapelId: 'm-pjok', namaGuru: 'Tri Wahyudi, S.Or.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Mempraktikkan gerak fundamental permainan bola besar dan teknik dasar kebugaran jasmani.' },
  { kelasId: 'k-7a', mapelId: 'm-infor', namaGuru: 'Rahmat Hidayat, S.Kom.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Memahami perangkat keras, sistem operasi komputer, dan berpikir komputasional sederhana.' },
  { kelasId: 'k-7a', mapelId: 'm-seni', namaGuru: 'Ratna Megasari, S.Sn.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Menggambar flora, fauna, dan ragam hias dengan memperhatikan komposisi, proporsi, dan perspektif.' },
  { kelasId: 'k-7a', mapelId: 'm-mulok', namaGuru: 'Ki Sudarsono, S.Pd.', kktp: 75, bobotFormatif: 50, bobotSumatif: 50, deskripsiMapel: 'Mengenal unggah-ungguh basa, tatakrama, serta membaca teks aksara daerah sederhana.' },
];

export function generateInitialScores(): NilaiRecord[] {
  const scores: NilaiRecord[] = [];
  const baseScores: Record<string, { fMin: number; fMax: number; sMin: number; sMax: number }> = {
    'm-pai': { fMin: 78, fMax: 94, sMin: 76, sMax: 92 },
    'm-ppkn': { fMin: 75, fMax: 90, sMin: 74, sMax: 92 },
    'm-bind': { fMin: 78, fMax: 92, sMin: 77, sMax: 90 },
    'm-mtk': { fMin: 68, fMax: 95, sMin: 65, sMax: 96 },
    'm-ipa': { fMin: 70, fMax: 92, sMin: 70, sMax: 94 },
    'm-ips': { fMin: 74, fMax: 91, sMin: 75, sMax: 93 },
    'm-bing': { fMin: 72, fMax: 96, sMin: 70, sMax: 95 },
    'm-pjok': { fMin: 80, fMax: 95, sMin: 80, sMax: 94 },
    'm-infor': { fMin: 78, fMax: 95, sMin: 76, sMax: 94 },
    'm-seni': { fMin: 80, fMax: 93, sMin: 80, sMax: 92 },
    'm-mulok': { fMin: 75, fMax: 92, sMin: 75, sMax: 90 },
  };

  const sampleDescriptions = (mapelNama: string, nilai: number, kktp: number) => {
    if (nilai >= 90) {
      return `Menunjukkan penguasaan materi yang sangat baik dan melampaui capaian pembelajaran ${mapelNama} dengan pemahaman konseptual yang matang.`;
    } else if (nilai >= kktp) {
      return `Mencapai kompetensi tujuan pembelajaran ${mapelNama} dengan baik, aktif dalam kegiatan belajar dan menyelesaikan tugas tepat waktu.`;
    } else {
      return `Perlu bimbingan dan peningkatan pemahaman serta latihan intensif pada beberapa materi pokok ${mapelNama}.`;
    }
  };

  // Predictable pseudo-random generation for deterministic initial data
  let seed = 42;
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  initialSiswaList.forEach((siswa, index) => {
    initialMapelList.forEach((mapel) => {
      const config = initialSubjectConfigs.find(c => c.mapelId === mapel.id) || { kktp: 75 };
      const range = baseScores[mapel.id] || { fMin: 75, fMax: 90, sMin: 75, sMax: 90 };
      
      // Top students get consistently higher, middle get normal
      const studentFactor = (15 - index) / 15 * 8 - 4;
      const fVal = Math.round(range.fMin + pseudoRand() * (range.fMax - range.fMin) + studentFactor);
      const sVal = Math.round(range.sMin + pseudoRand() * (range.sMax - range.sMin) + studentFactor);
      const clampF = Math.max(55, Math.min(100, fVal));
      const clampS = Math.max(55, Math.min(100, sVal));
      const akhir = Math.round((clampF + clampS) / 2);

      scores.push({
        id: `nr-${siswa.id}-${mapel.id}`,
        siswaId: siswa.id,
        mapelId: mapel.id,
        kelasId: siswa.kelasId,
        nilaiFormatif: clampF,
        nilaiSumatif: clampS,
        nilaiAkhir: akhir,
        capaianKompetensi: sampleDescriptions(mapel.nama, akhir, config.kktp),
      });
    });
  });

  return scores;
}

export const initialPresensiList: PresensiCatatan[] = [
  { siswaId: 's-1', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Pertahankan prestasi belajar dan keaktifan positif di dalam kelas.' },
  { siswaId: 's-2', kelasId: 'k-7a', sakit: 1, izin: 0, alpa: 0, catatanWaliKelas: 'Sangat rajin dan memiliki etika yang terpuji. Terus tingkatkan kemampuan.' },
  { siswaId: 's-3', kelasId: 'k-7a', sakit: 0, izin: 1, alpa: 0, catatanWaliKelas: 'Kemampuan akademis baik, perlu lebih aktif dalam kerja sama kelompok.' },
  { siswaId: 's-4', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Prestasi sangat memuaskan, pertahankan fokus dan ketelitian belajar.' },
  { siswaId: 's-5', kelasId: 'k-7a', sakit: 2, izin: 1, alpa: 0, catatanWaliKelas: 'Cukup baik, perlu meningkatkan kedisiplinan pengumpulan tugas harian.' },
  { siswaId: 's-6', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Menunjukkan peningkatan hasil belajar yang membanggakan.' },
  { siswaId: 's-7', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Kreatif dan mandiri, terus kembangkan potensi diri.' },
  { siswaId: 's-8', kelasId: 'k-7a', sakit: 1, izin: 0, alpa: 0, catatanWaliKelas: 'Perlu lebih fokus saat proses pembelajaran di kelas.' },
  { siswaId: 's-9', kelasId: 'k-7a', sakit: 0, izin: 1, alpa: 0, catatanWaliKelas: 'Sopan dan tekun, pertahankan motivasi belajar yang tinggi.' },
  { siswaId: 's-10', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Memiliki minat belajar yang baik, terus pertahankan.' },
  { siswaId: 's-11', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Belajar dengan teratur dan tunjukkan kemampuan terbaikmu.' },
  { siswaId: 's-12', kelasId: 'k-7a', sakit: 1, izin: 2, alpa: 0, catatanWaliKelas: 'Tingkatkan kehadiran dan konsistensi dalam mengulang materi.' },
  { siswaId: 's-13', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Hasil belajar sangat memuaskan dan berkarakter mulia.' },
  { siswaId: 's-14', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Cermat dalam berhitung dan berdiskusi dengan santun.' },
  { siswaId: 's-15', kelasId: 'k-7a', sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: 'Pertahankan antusiasme belajar dan semangat berprestasi.' },
];
