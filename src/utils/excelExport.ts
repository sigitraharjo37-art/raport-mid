import * as XLSX from 'xlsx';
import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, LegerRow, NilaiRecord } from '../types/rapor';

export function exportLeggerToExcel(
  schoolInfo: SchoolInfo,
  kelas: Kelas,
  mapelList: MataPelajaran[],
  subjectConfigs: SubjectConfig[],
  legerRows: LegerRow[]
) {
  const wb = XLSX.utils.book_new();

  // Prepare header rows
  const headerData: (string | number)[][] = [
    [schoolInfo.namaSekolah.toUpperCase()],
    [`LEGER NILAI ${schoolInfo.jenisRapor.toUpperCase()}`],
    [`TAHUN AJARAN ${schoolInfo.tahunAjaran} - SEMESTER ${schoolInfo.semester.toUpperCase()}`],
    [],
    [`Kelas: ${kelas.nama}`, '', `Wali Kelas: ${kelas.waliKelas}`, '', `NIP: ${kelas.nipWaliKelas}`],
    [`Kurikulum: ${schoolInfo.kurikulum}`, '', `Tanggal Cetak: ${schoolInfo.tempatTanggalRapor}`],
    [],
  ];

  // Table header row 1 (Titles & Mapel Names)
  const mapelHeaders = mapelList.map((m) => m.kode);
  const rowColNames = ['No', 'NIS', 'NISN', 'Nama Peserta Didik', 'L/P', ...mapelHeaders, 'Jumlah', 'Rata-rata', 'Peringkat', 'Tuntas', 'Belum Tuntas'];
  headerData.push(rowColNames);

  // Table header row 2 (KKTP / KKM per subject)
  const kktpRow = [
    '', '', '', 'KKTP / KKM', '',
    ...mapelList.map((m) => {
      const cfg = subjectConfigs.find((c) => c.kelasId === kelas.id && c.mapelId === m.id);
      return cfg ? cfg.kktp : 75;
    }),
    '', '', '', '', ''
  ];
  headerData.push(kktpRow);

  // Table Data Rows
  legerRows.forEach((row, idx) => {
    const studentRow: (string | number)[] = [
      idx + 1,
      row.siswa.nis,
      row.siswa.nisn,
      row.siswa.nama,
      row.siswa.jenisKelamin,
      ...mapelList.map((m) => row.nilaiMapel[m.id] || 0),
      row.totalNilai,
      row.rataRata,
      row.ranking,
      row.jumlahTuntas,
      row.jumlahBelumTuntas,
    ];
    headerData.push(studentRow);
  });

  // Summary statistics rows
  headerData.push([]);
  
  // Calculate average per subject
  const avgRow: (string | number)[] = ['', '', '', 'RATA-RATA KELAS', ''];
  const maxRow: (string | number)[] = ['', '', '', 'NILAI TERTINGGI', ''];
  const minRow: (string | number)[] = ['', '', '', 'NILAI TERENDAH', ''];

  mapelList.forEach((m) => {
    const scores = legerRows.map((r) => r.nilaiMapel[m.id] || 0).filter((v) => v > 0);
    if (scores.length > 0) {
      const sum = scores.reduce((acc, c) => acc + c, 0);
      avgRow.push(parseFloat((sum / scores.length).toFixed(1)));
      maxRow.push(Math.max(...scores));
      minRow.push(Math.min(...scores));
    } else {
      avgRow.push(0);
      maxRow.push(0);
      minRow.push(0);
    }
  });

  // Overall class averages
  const allTotals = legerRows.map((r) => r.totalNilai);
  const allAvgs = legerRows.map((r) => r.rataRata);
  if (allTotals.length > 0) {
    avgRow.push(
      parseFloat((allTotals.reduce((a, b) => a + b, 0) / allTotals.length).toFixed(1)),
      parseFloat((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1)),
      '-', '-', '-'
    );
    maxRow.push(Math.max(...allTotals), Math.max(...allAvgs), 1, '-', '-');
    minRow.push(Math.min(...allTotals), Math.min(...allAvgs), allTotals.length, '-', '-');
  }

  headerData.push(avgRow);
  headerData.push(maxRow);
  headerData.push(minRow);

  // Signatures
  headerData.push([]);
  headerData.push([]);
  headerData.push(['', '', '', '', '', '', '', '', '', schoolInfo.tempatTanggalRapor]);
  headerData.push(['Mengetahui,', '', '', '', '', '', '', '', '', 'Wali Kelas,']);
  headerData.push(['Kepala Sekolah,']);
  headerData.push([]);
  headerData.push([]);
  headerData.push([schoolInfo.namaKepalaSekolah, '', '', '', '', '', '', '', '', kelas.waliKelas]);
  headerData.push([`NIP. ${schoolInfo.nipKepalaSekolah}`, '', '', '', '', '', '', '', '', `NIP. ${kelas.nipWaliKelas}`]);

  const ws = XLSX.utils.aoa_to_sheet(headerData);

  // Column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 10 }, // NIS
    { wch: 14 }, // NISN
    { wch: 30 }, // Nama
    { wch: 6 },  // L/P
    ...mapelList.map(() => ({ wch: 9 })),
    { wch: 10 }, // Total
    { wch: 10 }, // Rata-rata
    { wch: 10 }, // Peringkat
    { wch: 8 },  // Tuntas
    { wch: 12 }, // Belum Tuntas
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, `Leger ${kelas.nama}`);

  const cleanKelasName = kelas.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Leger_Nilai_${cleanKelasName}_${schoolInfo.tahunAjaran.replace('/', '-')}.xlsx`);
}

export function exportNilaiMapelToExcel(
  schoolInfo: SchoolInfo,
  kelas: Kelas,
  mapel: MataPelajaran,
  config: SubjectConfig,
  siswaList: Siswa[],
  records: NilaiRecord[]
) {
  const wb = XLSX.utils.book_new();
  const showFormatif = schoolInfo.tampilkanFormatif ?? true;
  const showSumatif = schoolInfo.tampilkanSumatif ?? true;

  let tableHeaders = ['No', 'NIS', 'NISN', 'Nama Siswa', 'L/P'];
  if (showFormatif && showSumatif) {
    tableHeaders.push('Nilai Formatif (Tugas)', 'Nilai Sumatif (STS)', 'Nilai Akhir');
  } else if (showFormatif) {
    tableHeaders.push('Nilai Formatif (Tugas / TP)', 'Nilai Akhir');
  } else {
    tableHeaders.push('Nilai Sumatif (STS / PTS)', 'Nilai Akhir');
  }
  tableHeaders.push('Status KKTP', 'Capaian Kompetensi / Deskripsi');

  const data: (string | number)[][] = [
    [schoolInfo.namaSekolah.toUpperCase()],
    [`DAFTAR NILAI ${schoolInfo.jenisRapor.toUpperCase()}`],
    [`MATA PELAJARAN: ${mapel.nama.toUpperCase()} (${mapel.kode})`],
    [`Kelas: ${kelas.nama} | Guru: ${config.namaGuru} | KKTP/KKM: ${config.kktp}`],
    [`Tahun Ajaran: ${schoolInfo.tahunAjaran} | Semester: ${schoolInfo.semester}`],
    [],
    tableHeaders,
  ];

  siswaList.forEach((s, idx) => {
    const rec = records.find((r) => r.siswaId === s.id && r.mapelId === mapel.id);
    const fVal = rec ? rec.nilaiFormatif : 0;
    const sVal = rec ? rec.nilaiSumatif : 0;
    const finalVal = rec ? rec.nilaiAkhir : 0;
    const status = finalVal >= config.kktp ? 'TUNTAS' : 'BELUM TUNTAS';
    const deskripsi = rec ? rec.capaianKompetensi : '';

    const row: (string | number)[] = [
      idx + 1,
      s.nis,
      s.nisn,
      s.nama,
      s.jenisKelamin,
    ];

    if (showFormatif && showSumatif) {
      row.push(fVal, sVal, finalVal);
    } else if (showFormatif) {
      row.push(fVal, finalVal);
    } else {
      row.push(sVal, finalVal);
    }

    row.push(status, deskripsi);
    data.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 14 },
    { wch: 30 },
    { wch: 6 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `${mapel.kode}_${kelas.nama}`);
  XLSX.writeFile(wb, `Nilai_${mapel.kode}_Kelas_${kelas.nama}.xlsx`);
}
