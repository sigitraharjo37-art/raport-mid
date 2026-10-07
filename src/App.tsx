/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SchoolInfo,
  Kelas,
  MataPelajaran,
  Siswa,
  SubjectConfig,
  NilaiRecord,
  PresensiCatatan,
  Guru,
  AuthUser,
} from './types/rapor';
import {
  loadSchoolInfo,
  saveSchoolInfo,
  loadGuruList,
  saveGuruList,
  loadKelasList,
  saveKelasList,
  loadMapelList,
  saveMapelList,
  loadSiswaList,
  saveSiswaList,
  loadSubjectConfigs,
  saveSubjectConfigs,
  loadScores,
  saveScores,
  loadPresensi,
  savePresensi,
  resetAllToDefault,
} from './utils/storage';
import {
  initializeCloudDatabase,
  subscribeToRealtimeCloudData,
  saveSchoolInfoCloud,
  saveGurusCloud,
  saveKelasCloud,
  saveMapelCloud,
  saveSiswaCloud,
  saveSubjectConfigsCloud,
  saveScoresCloud,
  savePresensiCloud,
  deleteGuruCloud,
  deleteSiswaCloud,
  deleteBatchSiswaCloud,
  deleteKelasCloud,
  deleteMapelCloud,
  purgeAllDemoGurusCloud,
  purgeAllDemoSiswaCloud,
  syncAllToCloud,
} from './utils/cloudStorage';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InputNilaiView } from './components/InputNilaiView';
import { LeggerView } from './components/LeggerView';
import { RaporPrintView } from './components/RaporPrintView';
import { PresensiView } from './components/PresensiView';
import { DataGuruView } from './components/DataGuruView';
import { DataSiswaView } from './components/DataSiswaView';
import { DataKelasView } from './components/DataKelasView';
import { DataMapelView } from './components/DataMapelView';
import { DataSekolahModal } from './components/DataSekolahModal';
import { LoginPage } from './components/LoginPage';

export default function App() {
  // Primary States
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(loadSchoolInfo);
  const [guruList, setGuruList] = useState<Guru[]>(loadGuruList);
  const [kelasList, setKelasList] = useState<Kelas[]>(loadKelasList);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>(loadMapelList);
  const [siswaList, setSiswaList] = useState<Siswa[]>(loadSiswaList);
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>(loadSubjectConfigs);
  const [scoresList, setScoresList] = useState<NilaiRecord[]>(loadScores);
  const [presensiList, setPresensiList] = useState<PresensiCatatan[]>(loadPresensi);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelasList[0]?.id || '');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('erapor_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('erapor_current_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('erapor_current_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Ensure selected class is valid
  useEffect(() => {
    if (!kelasList.some((k) => k.id === selectedKelasId) && kelasList.length > 0) {
      setSelectedKelasId(kelasList[0].id);
    }
  }, [kelasList, selectedKelasId]);

  // Connect to Firebase Firestore & Listen to Real-Time Updates
  useEffect(() => {
    // 1. Initialize cloud database & seed if empty
    initializeCloudDatabase();

    // Ensure KOP header is set to Lombok Utara by default
    setSchoolInfo((prev) => {
      const cleanKop2 = (prev.kopInstansi2 || 'Dinas Pendidikan, Kebudayaan, Pemuda dan Olahraga (Dikbudpora)').replace(/\s*Kabupaten Lombok Utara\s*$/i, '');
      if (
        !prev.kopInstansi1 ||
        prev.kopInstansi1.includes('PEMERINTAH DAERAH') ||
        prev.kopInstansi1.includes('DKI') ||
        prev.kopInstansi2?.includes('Kabupaten Lombok Utara')
      ) {
        const next = {
          ...prev,
          kopInstansi1: 'PEMERINTAH KABUPATEN LOMBOK UTARA',
          kopInstansi2: cleanKop2,
          kabupatenKota: prev.kabupatenKota && !prev.kabupatenKota.includes('Jakarta') ? prev.kabupatenKota : 'Kabupaten Lombok Utara',
          provinsi: prev.provinsi && !prev.provinsi.includes('DKI') ? prev.provinsi : 'Nusa Tenggara Barat',
        };
        saveSchoolInfoCloud(next);
        return next;
      }
      return prev;
    });

    // 2. Real-time multi-device sync listener
    const unsubscribe = subscribeToRealtimeCloudData((cloudData) => {
      if (cloudData.schoolInfo) {
        const cleanKop2 = (cloudData.schoolInfo.kopInstansi2 || 'Dinas Pendidikan, Kebudayaan, Pemuda dan Olahraga (Dikbudpora)').replace(/\s*Kabupaten Lombok Utara\s*$/i, '');
        const info = {
          ...cloudData.schoolInfo,
          kopInstansi1: cloudData.schoolInfo.kopInstansi1 || 'PEMERINTAH KABUPATEN LOMBOK UTARA',
          kopInstansi2: cleanKop2,
        };
        setSchoolInfo(info);
      }
      if (cloudData.gurus) setGuruList(cloudData.gurus);
      if (cloudData.kelas) setKelasList(cloudData.kelas);
      if (cloudData.mapel) setMapelList(cloudData.mapel);
      if (cloudData.siswa) setSiswaList(cloudData.siswa);
      if (cloudData.configs) setSubjectConfigs(cloudData.configs);
      if (cloudData.scores) setScoresList(cloudData.scores);
      if (cloudData.presensi) setPresensiList(cloudData.presensi);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handlers for School Profile
  const handleSaveSchoolInfo = (info: SchoolInfo) => {
    setSchoolInfo(info);
    saveSchoolInfoCloud(info);
  };

  // Handlers for Guru
  const handleAddGuru = (newG: Guru) => {
    const updated = [...guruList, newG];
    setGuruList(updated);
    saveGurusCloud(updated);
  };

  const handleAddBatchGuru = (newGurus: Guru[]) => {
    const updated = [...guruList, ...newGurus];
    setGuruList(updated);
    saveGurusCloud(updated);
  };

  const handleUpdateGuru = (updatedG: Guru) => {
    const updated = guruList.map((g) => (g.id === updatedG.id ? updatedG : g));
    setGuruList(updated);
    saveGurusCloud(updated);
  };

  const handleDeleteGuru = (id: string) => {
    const updated = guruList.filter((g) => g.id !== id);
    setGuruList(updated);
    saveGuruList(updated);
    deleteGuruCloud(id);
  };

  const handlePurgeAllDemoGurus = async () => {
    if (!confirm('Hapus PERMANEN semua data guru demo bawaan dari Cloud dan Local?')) return;
    await purgeAllDemoGurusCloud();
    const demoIds = ['g-1', 'g-2', 'g-3', 'g-4', 'g-5', 'g-6', 'g-7', 'g-8', 'g-9', 'g-10', 'g-11', 'g-12', 'g-13'];
    const updated = guruList.filter((g) => !demoIds.includes(g.id));
    setGuruList(updated);
    saveGuruList(updated);
    alert('Seluruh data guru demo berhasil dihapus permanen dari Cloud dan Lokal!');
  };

  // Handlers for Kelas
  const handleAddKelas = (newK: Kelas) => {
    const updated = [...kelasList, newK];
    setKelasList(updated);
    saveKelasCloud(updated);
    setSelectedKelasId(newK.id);
  };

  const handleAddBatchKelas = (newClasses: Kelas[]) => {
    const updated = [...kelasList, ...newClasses];
    setKelasList(updated);
    saveKelasCloud(updated);
  };

  const handleUpdateKelas = (updatedK: Kelas) => {
    const updated = kelasList.map((k) => (k.id === updatedK.id ? updatedK : k));
    setKelasList(updated);
    saveKelasCloud(updated);
  };

  const handleDeleteKelas = (id: string) => {
    const updated = kelasList.filter((k) => k.id !== id);
    setKelasList(updated);
    saveKelasList(updated);
    deleteKelasCloud(id);
    if (selectedKelasId === id && updated.length > 0) {
      setSelectedKelasId(updated[0].id);
    }
  };

  // Handlers for Mapel
  const handleAddMapel = (newM: MataPelajaran) => {
    const updated = [...mapelList, newM];
    setMapelList(updated);
    saveMapelCloud(updated);
  };

  const handleUpdateMapel = (updatedM: MataPelajaran) => {
    const updated = mapelList.map((m) => (m.id === updatedM.id ? updatedM : m));
    setMapelList(updated);
    saveMapelCloud(updated);
  };

  const handleDeleteMapel = (id: string) => {
    const updated = mapelList.filter((m) => m.id !== id);
    setMapelList(updated);
    saveMapelList(updated);
    deleteMapelCloud(id);
  };

  // Handlers for Siswa
  const handleAddSiswa = (newS: Siswa) => {
    const updated = [...siswaList, newS];
    setSiswaList(updated);
    saveSiswaCloud(updated);
  };

  const handleAddBatchSiswa = (newStudents: Siswa[]) => {
    const updated = [...siswaList, ...newStudents];
    setSiswaList(updated);
    saveSiswaCloud(updated);
  };

  const handleUpdateSiswa = (updatedS: Siswa) => {
    const updated = siswaList.map((s) => (s.id === updatedS.id ? updatedS : s));
    setSiswaList(updated);
    saveSiswaCloud(updated);
  };

  const handleDeleteSiswa = (id: string) => {
    const updated = siswaList.filter((s) => s.id !== id);
    setSiswaList(updated);
    saveSiswaList(updated);
    deleteSiswaCloud(id);

    // Also remove local scores and presensi for this student
    const updatedScores = scoresList.filter((sc) => sc.siswaId !== id);
    setScoresList(updatedScores);
    saveScores(updatedScores);

    const updatedPresensi = presensiList.filter((p) => p.siswaId !== id);
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);
  };

  const handleDeleteBatchSiswa = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const updated = siswaList.filter((s) => !idSet.has(s.id));
    setSiswaList(updated);
    saveSiswaList(updated);
    await deleteBatchSiswaCloud(ids);

    // Also remove local scores and presensi for these students
    const updatedScores = scoresList.filter((sc) => !idSet.has(sc.siswaId));
    setScoresList(updatedScores);
    saveScores(updatedScores);

    const updatedPresensi = presensiList.filter((p) => !idSet.has(p.siswaId));
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);
  };

  const handlePurgeAllDemoSiswa = async () => {
    if (!confirm('Hapus PERMANEN semua data peserta didik demo bawaan dari Cloud dan Local?')) return;
    await purgeAllDemoSiswaCloud();
    const demoIds = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6', 's-7', 's-8', 's-9', 's-10', 's-11', 's-12', 's-13', 's-14', 's-15'];
    const updatedSiswa = siswaList.filter((s) => !demoIds.includes(s.id));
    setSiswaList(updatedSiswa);
    saveSiswaList(updatedSiswa);

    const updatedScores = scoresList.filter((sc) => !demoIds.includes(sc.siswaId));
    setScoresList(updatedScores);
    saveScores(updatedScores);

    const updatedPresensi = presensiList.filter((p) => !demoIds.includes(p.siswaId));
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);

    alert('Seluruh data siswa demo berhasil dihapus permanen dari Cloud dan Lokal!');
  };

  // Handlers for Subject Config & Scores
  const handleSaveConfig = (newConf: SubjectConfig) => {
    const filtered = subjectConfigs.filter(
      (c) => !(c.kelasId === newConf.kelasId && c.mapelId === newConf.mapelId)
    );
    const updated = [...filtered, newConf];
    setSubjectConfigs(updated);
    saveSubjectConfigsCloud(updated);
  };

  const handleSaveScores = (newScores: NilaiRecord[]) => {
    setScoresList(newScores);
    saveScoresCloud(newScores);
  };

  // Handlers for Presensi
  const handleSavePresensi = (newPresensi: PresensiCatatan[]) => {
    setPresensiList(newPresensi);
    savePresensiCloud(newPresensi);
  };

  // Reset to Demo
  const handleResetData = async () => {
    resetAllToDefault();
    const sInfo = loadSchoolInfo();
    const gList = loadGuruList();
    const kList = loadKelasList();
    const mList = loadMapelList();
    const sList = loadSiswaList();
    const cList = loadSubjectConfigs();
    const scList = loadScores();
    const pList = loadPresensi();

    setSchoolInfo(sInfo);
    setGuruList(gList);
    setKelasList(kList);
    setMapelList(mList);
    setSiswaList(sList);
    setSubjectConfigs(cList);
    setScoresList(scList);
    setPresensiList(pList);

    await syncAllToCloud({
      schoolInfo: sInfo,
      gurus: gList,
      kelas: kList,
      mapel: mList,
      siswa: sList,
      configs: cList,
      scores: scList,
      presensi: pList,
    });
    alert('Data berhasil direset ke contoh bawaan (Demo) dan disinkronkan ke Cloud Database!');
  };

  // Backup JSON
  const handleExportJson = () => {
    const backup = {
      schoolInfo,
      guruList,
      kelasList,
      mapelList,
      siswaList,
      subjectConfigs,
      scoresList,
      presensiList,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_eRapor_${schoolInfo.namaSekolah.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const newSchool = parsed.schoolInfo || schoolInfo;
        const newGurus = parsed.guruList || guruList;
        const newKelas = parsed.kelasList || kelasList;
        const newMapel = parsed.mapelList || mapelList;
        const newSiswa = parsed.siswaList || siswaList;
        const newConfigs = parsed.subjectConfigs || subjectConfigs;
        const newScores = parsed.scoresList || scoresList;
        const newPresensi = parsed.presensiList || presensiList;

        setSchoolInfo(newSchool);
        setGuruList(newGurus);
        setKelasList(newKelas);
        setMapelList(newMapel);
        setSiswaList(newSiswa);
        setSubjectConfigs(newConfigs);
        setScoresList(newScores);
        setPresensiList(newPresensi);

        saveSchoolInfo(newSchool);
        saveGuruList(newGurus);
        saveKelasList(newKelas);
        saveMapelList(newMapel);
        saveSiswaList(newSiswa);
        saveSubjectConfigs(newConfigs);
        saveScores(newScores);
        savePresensi(newPresensi);

        await syncAllToCloud({
          schoolInfo: newSchool,
          gurus: newGurus,
          kelas: newKelas,
          mapel: newMapel,
          siswa: newSiswa,
          configs: newConfigs,
          scores: newScores,
          presensi: newPresensi,
        });

        alert('Berhasil memulihkan data dari file JSON dan menyelaraskan ke Cloud Database!');
      } catch (err) {
        alert('File backup JSON tidak valid!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // If not logged in, show LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        schoolInfo={schoolInfo}
        guruList={guruList}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Header */}
      <HeaderNav
        schoolInfo={schoolInfo}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSchoolSettings={() => setIsSchoolModalOpen(true)}
        onResetData={handleResetData}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onTabChange={setActiveTab}
          onOpenSchoolSettings={() => setIsSchoolModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              schoolInfo={schoolInfo}
              kelasList={kelasList}
              mapelList={mapelList}
              siswaList={siswaList}
              subjectConfigs={subjectConfigs}
              scoresList={scoresList}
              onNavigate={setActiveTab}
              onSelectKelas={setSelectedKelasId}
              selectedKelasId={selectedKelasId}
            />
          )}

          {activeTab === 'nilai' && (
            <InputNilaiView
              schoolInfo={schoolInfo}
              kelasList={kelasList}
              mapelList={mapelList}
              siswaList={siswaList}
              guruList={guruList}
              subjectConfigs={subjectConfigs}
              scoresList={scoresList}
              onSaveScores={handleSaveScores}
              onSaveConfig={handleSaveConfig}
            />
          )}

          {activeTab === 'legger' && (
            <LeggerView
              schoolInfo={schoolInfo}
              kelasList={kelasList}
              selectedKelasId={selectedKelasId}
              onSelectKelas={setSelectedKelasId}
              mapelList={mapelList}
              siswaList={siswaList}
              subjectConfigs={subjectConfigs}
              scoresList={scoresList}
            />
          )}

          {activeTab === 'rapor' && (
            <RaporPrintView
              schoolInfo={schoolInfo}
              kelasList={kelasList}
              selectedKelasId={selectedKelasId}
              onSelectKelas={setSelectedKelasId}
              mapelList={mapelList}
              siswaList={siswaList}
              subjectConfigs={subjectConfigs}
              scoresList={scoresList}
              presensiList={presensiList}
            />
          )}

          {activeTab === 'presensi' && (
            <PresensiView
              kelasList={kelasList}
              selectedKelasId={selectedKelasId}
              onSelectKelas={setSelectedKelasId}
              siswaList={siswaList}
              presensiList={presensiList}
              onSavePresensi={handleSavePresensi}
            />
          )}

          {activeTab === 'guru' && (
            <DataGuruView
              guruList={guruList}
              onAddGuru={handleAddGuru}
              onUpdateGuru={handleUpdateGuru}
              onDeleteGuru={handleDeleteGuru}
              onAddBatchGuru={handleAddBatchGuru}
              onPurgeDemoGurus={handlePurgeAllDemoGurus}
            />
          )}

          {activeTab === 'siswa' && (
            <DataSiswaView
              kelasList={kelasList}
              selectedKelasId={selectedKelasId}
              onSelectKelas={setSelectedKelasId}
              siswaList={siswaList}
              onAddSiswa={handleAddSiswa}
              onUpdateSiswa={handleUpdateSiswa}
              onDeleteSiswa={handleDeleteSiswa}
              onAddBatchSiswa={handleAddBatchSiswa}
              onDeleteBatchSiswa={handleDeleteBatchSiswa}
              onPurgeDemoSiswa={handlePurgeAllDemoSiswa}
              onAddBatchKelas={handleAddBatchKelas}
            />
          )}

          {activeTab === 'kelas' && (
            <DataKelasView
              kelasList={kelasList}
              siswaList={siswaList}
              guruList={guruList}
              onAddKelas={handleAddKelas}
              onUpdateKelas={handleUpdateKelas}
              onDeleteKelas={handleDeleteKelas}
            />
          )}

          {activeTab === 'mapel' && (
            <DataMapelView
              mapelList={mapelList}
              onAddMapel={handleAddMapel}
              onUpdateMapel={handleUpdateMapel}
              onDeleteMapel={handleDeleteMapel}
            />
          )}
        </main>
      </div>

      {/* School Settings Modal */}
      <DataSekolahModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        schoolInfo={schoolInfo}
        onSave={handleSaveSchoolInfo}
      />
    </div>
  );
}
