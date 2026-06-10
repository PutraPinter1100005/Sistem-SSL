/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp,
  getDocs,
  query
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

export interface ERPUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

interface FirebaseContextType {
  user: User | ERPUser | null;
  loadingAuth: boolean;
  customers: any[];
  parameters: any[];
  master_parameters: any[];
  tariffs: any[];
  fleets: any[];
  drivers: any[];
  jobOrders: any[];
  job_orders: any[];
  spks: any[];
  invoices: any[];
  master_customers: any[];
  master_vendors: any[];
  master_drivers: any[];
  master_trucks: any[];
  master_tarifs: any[];
  loadingData: Record<string, boolean>;
  
  // CRUD actions helper
  addEntity: (collectionName: string, data: any) => Promise<any>;
  updateEntity: (collectionName: string, id: string, data: any) => Promise<void>;
  deleteEntity: (collectionName: string, id: string) => Promise<void>;
  
  // Auth actions
  loginGoogle: () => Promise<void>;
  loginAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | ERPUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // States for each ERP Collection
  const [customers, setCustomers] = useState<any[]>([]);
  const [parameters, setParameters] = useState<any[]>([]);
  const [master_parameters, setMasterParameters] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [fleets, setFleets] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [job_orders, setJobOrders_col] = useState<any[]>([]);
  const [spks, setSpks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [master_customers, setMasterCustomers] = useState<any[]>([]);
  const [master_vendors, setMasterVendors] = useState<any[]>([]);
  const [master_drivers, setMasterDrivers] = useState<any[]>([]);
  const [master_trucks, setMasterTrucks] = useState<any[]>([]);
  const [master_tarifs, setMasterTarifs] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState<Record<string, boolean>>({
    customers: true,
    parameters: true,
    master_parameters: true,
    tariffs: true,
    fleets: true,
    drivers: true,
    jobOrders: true,
    job_orders: true,
    spks: true,
    invoices: true,
    master_customers: true,
    master_vendors: true,
    master_drivers: true,
    master_trucks: true,
    master_tarifs: true,
  });

  // Track if we've seeded custom parameters list
  const [seeded, setSeeded] = useState(false);

  // Monitor authentication state on mount
  useEffect(() => {
    // Check if there was an active local demo user
    const savedDemoUser = localStorage.getItem('ssl_demo_user');
    if (savedDemoUser) {
      try {
        setUser(JSON.parse(savedDemoUser));
        setLoadingAuth(false);
      } catch (e) {
        localStorage.removeItem('ssl_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        localStorage.removeItem('ssl_demo_user');
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
          emailVerified: currentUser.emailVerified,
        });
      } else {
        const isDemo = localStorage.getItem('ssl_demo_user');
        if (!isDemo) {
          setUser(null);
        }
      }
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  // Standard generic seeder helper to create default parameters/materials if collections are empty
  const triggerAutoSeed = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'parameters'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log("Seeding parameters because database is clean...");
        const defaultParams = [
          { id: 'TAX_PPN', key: 'TAX_PPN', value: '11', category: 'PAJAK', description: 'Pajak Pertambahan Nilai standar logistik' },
          { id: 'FUEL_PRICE', key: 'FUEL_PRICE', value: '14500', category: 'OPERASIONAL', description: 'Tarif dasar bensin solar industri per liter' },
          { id: 'PPH_23', key: 'PPH_23', value: '2', category: 'PAJAK', description: 'Pajak Penghasilan Pasal 23' },
        ];
        for (const item of defaultParams) {
          await setDoc(doc(db, 'parameters', item.id), item);
        }
      }

      // Auto-seed master_parameters collection if empty
      const qMaster = query(collection(db, 'master_parameters'));
      const snapshotMaster = await getDocs(qMaster);
      if (snapshotMaster.empty) {
        console.log("Seeding master_parameters because database is clean...");
        const defaultMasterParams = [
          // Tipe Armada
          { id: 'armada_fuso', category: 'armada', code: 'FUSO', name: 'Truk Fuso' },
          { id: 'armada_tronton', category: 'armada', code: 'TRONTON', name: 'Truk Tronton' },
          { id: 'armada_wingbox', category: 'armada', code: 'WINGBOX', name: 'Truk Wingbox' },
          // Satuan Ukur
          { id: 'uom_kg', category: 'uom', code: 'KG', name: 'Kilogram' },
          { id: 'uom_ton', category: 'uom', code: 'TON', name: 'Tonase' },
          { id: 'uom_rit', category: 'uom', code: 'RIT', name: 'Ritase' },
          { id: 'uom_box', category: 'uom', code: 'BOX', name: 'Karton/Box' },
          // Lokasi/Pelabuhan
          { id: 'lokasi_tanjung_priok', category: 'lokasi', code: 'TPRIOK', name: 'Pelabuhan Tanjung Priok, Jakarta' },
          { id: 'lokasi_tanjung_perak', category: 'lokasi', code: 'TPERAK', name: 'Pelabuhan Tanjung Perak, Surabaya' },
          { id: 'lokasi_merak', category: 'lokasi', code: 'MERAK', name: 'Pelabuhan Merak, Banten' },
          // Syarat Pembayaran
          { id: 'syarat_cod', category: 'syarat', code: 'COD', name: 'Cash on Delivery' },
          { id: 'syarat_net7', category: 'syarat', code: 'NET7', name: 'Net 7 Hari' },
          { id: 'syarat_net14', category: 'syarat', code: 'NET14', name: 'Net 14 Hari' },
          { id: 'syarat_net30', category: 'syarat', code: 'NET30', name: 'Net 30 Hari' },
        ];
        for (const item of defaultMasterParams) {
          await setDoc(doc(db, 'master_parameters', item.id), item);
        }
      }
    } catch (e) {
      console.warn("Auto-seeding was rejected or bypassed:", e);
    }
  };

  useEffect(() => {
    if (user) {
      triggerAutoSeed();
    }
  }, [user]);

  // Handle active operational subscription snapshot listeners
  useEffect(() => {
    if (loadingAuth || !user) {
      // Clear data if not logged in to avoid showing stale data from previous sessions or unauthenticated access
      setCustomers([]);
      setParameters([]);
      setMasterParameters([]);
      setTariffs([]);
      setFleets([]);
      setDrivers([]);
      setJobOrders([]);
      setSpks([]);
      setInvoices([]);
      setMasterCustomers([]);
      setMasterVendors([]);
      setMasterDrivers([]);
      setMasterTrucks([]);
      setMasterTarifs([]);
      setLoadingData({
        customers: false,
        parameters: false,
        master_parameters: false,
        tariffs: false,
        fleets: false,
        drivers: false,
        jobOrders: false,
        job_orders: false,
        spks: false,
        invoices: false,
        master_customers: false,
        master_vendors: false,
        master_drivers: false,
        master_trucks: false,
        master_tarifs: false,
      });
      return;
    }

    setLoadingData({
      customers: true,
      parameters: true,
      master_parameters: true,
      tariffs: true,
      fleets: true,
      drivers: true,
      jobOrders: true,
      job_orders: true,
      spks: true,
      invoices: true,
      master_customers: true,
      master_vendors: true,
      master_drivers: true,
      master_trucks: true,
      master_tarifs: true,
    });

    const collectionsToSubscribe = [
      { name: 'customers', setter: setCustomers },
      { name: 'parameters', setter: setParameters },
      { name: 'master_parameters', setter: setMasterParameters },
      { name: 'tariffs', setter: setTariffs },
      { name: 'fleets', setter: setFleets },
      { name: 'drivers', setter: setDrivers },
      { name: 'jobOrders', setter: setJobOrders },
      { name: 'job_orders', setter: setJobOrders_col },
      { name: 'spks', setter: setSpks },
      { name: 'invoices', setter: setInvoices },
      { name: 'master_customers', setter: setMasterCustomers },
      { name: 'master_vendors', setter: setMasterVendors },
      { name: 'master_drivers', setter: setMasterDrivers },
      { name: 'master_trucks', setter: setMasterTrucks },
      { name: 'master_tarifs', setter: setMasterTarifs },
    ];

    const unsubscribes = collectionsToSubscribe.map(({ name, setter }) => {
      const ref = collection(db, name);
      return onSnapshot(
        ref,
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setter(list);
          setLoadingData(prev => ({ ...prev, [name]: false }));
        },
        (error) => {
          console.error(`Snapshot subscription error on ${name}:`, error);
          try {
            handleFirestoreError(error, OperationType.GET, name);
          } catch (e) {
            console.warn("Muted firestore error cleanly from disrupting main thread:", e);
          }
          setLoadingData(prev => ({ ...prev, [name]: false }));
        }
      );
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, loadingAuth]);

  // Generic Create Add helper
  const addEntity = async (collectionName: string, data: any) => {
    const path = `${collectionName}`;
    try {
      const finalId = data.id || `${collectionName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { ...data, id: finalId };
      
      // Use setDoc to strictly control the document ID according to security rules and requirements
      await setDoc(doc(db, collectionName, finalId), payload);
      console.log(`Successfully added entity under ${collectionName}/${finalId}`);
      return payload;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Generic Update helper
  const updateEntity = async (collectionName: string, id: string, data: any) => {
    const path = `${collectionName}/${id}`;
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      console.log(`Successfully updated entity ${path}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Generic Delete helper
  const deleteEntity = async (collectionName: string, id: string) => {
    const path = `${collectionName}/${id}`;
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted entity ${path}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Google Login popup
  const loginGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google authentication error:", error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setAuthError("Sesi login dibatalkan karena popup Google ditutup sebelum selesai.");
      } else if (error?.message) {
        setAuthError(`Gagal menghubungi Google Auth: ${error.message}`);
      } else {
        setAuthError("Terjadi kendala saat menghubungkan akun Google Anda.");
      }
    }
  };

  // Safe fallback to play and test with Anonymous session (Tipe Sopir/Demo)
  const loginAnonymous = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.warn("Firebase Anonymous Sign-In is restricted or disabled on the project console. Falling back to an isolated Local Demo Session dynamically:", error);
      
      // Construct a highly robust local simulated ERP driver session
      const simulatedDemoUser: ERPUser = {
        uid: 'demo-sopir-lapangan',
        email: 'sopir.demo@ssl-logistics.id',
        displayName: 'Sopir Lapangan (Demo)',
        photoURL: null,
        isAnonymous: true,
        emailVerified: false,
      };
      
      setUser(simulatedDemoUser);
      localStorage.setItem('ssl_demo_user', JSON.stringify(simulatedDemoUser));
    }
  };

  // Google & Local Logout
  const logout = async () => {
    try {
      localStorage.removeItem('ssl_demo_user');
      setUser(null);
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loadingAuth,
      customers,
      parameters,
      master_parameters,
      tariffs,
      fleets,
      drivers,
      jobOrders,
      job_orders,
      spks,
      invoices,
      master_customers,
      master_vendors,
      master_drivers,
      master_trucks,
      master_tarifs,
      loadingData,
      addEntity,
      updateEntity,
      deleteEntity,
      loginGoogle,
      loginAnonymous,
      logout,
      authError,
      clearAuthError
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
