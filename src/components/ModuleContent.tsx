/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  Truck,
  User as UserIcon,
  DollarSign,
  FileText,
  BadgeAlert,
  Loader2,
  ListFilter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calculator,
  PlusCircle,
  MinusCircle,
  Briefcase
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';
import CustomerView from './CustomerView';
import VendorView from './VendorView';
import DriverView from './DriverView';
import TruckView from './TruckView';
import JobOrderView from './JobOrderView';
import OperationalView from './OperationalView';
import MasterTarifView from './MasterTarifView';
import TaxSettings from './TaxSettings';

const MASTER_CATEGORIES = [
  { id: 'armada', name: 'Tipe Armada', description: 'Konfigurasi tipe armada logistik' },
  { id: 'uom', name: 'Satuan Ukur (UoM)', description: 'Satuan pengukuran volume/berat cargo' },
  { id: 'lokasi', name: 'Lokasi/Pelabuhan', description: 'Pelabuhan transit & depo kontainer' },
  { id: 'syarat', name: 'Syarat Pembayaran', description: 'Term of Payment penagihan ERP' },
  { id: 'pajak', name: 'Pengaturan Pajak', description: 'Konfigurasi perpajakan PPN, PPh23 & DPP' }
];

interface ModuleContentProps {
  moduleId: string;
  activeSubTab: 'list' | 'input';
  setSubTab: (tab: 'list' | 'input') => void;
}

export default function ModuleContent({ moduleId, activeSubTab, setSubTab }: ModuleContentProps) {
  const {
    customers,
    parameters,
    master_parameters,
    tariffs,
    fleets,
    drivers,
    jobOrders,
    spks,
    invoices,
    addEntity,
    updateEntity,
    deleteEntity,
    loadingData
  } = useFirebase();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    id: '', 
    name: '', 
    companyName: '', 
    email: '', 
    phone: '', 
    address: '', 
    status: 'active',
    customerGroup: '',
    npwp: '',
    top: '7 Hari',
    billingAddress: '',
    pics: [] as Array<{ role: string; name: string; email: string; phone: string }>
  });
  const [parameterForm, setParameterForm] = useState({ id: '', key: '', value: '', category: 'OPERASIONAL', description: '' });
  
  // Custom states for Master Parameter central dictionary
  const [selectedCategory, setSelectedCategory] = useState('armada');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isOpenMasterModal, setIsOpenMasterModal] = useState(false);
  const [masterParamForm, setMasterParamForm] = useState({ code: '', name: '' });
  const [tariffForm, setTariffForm] = useState({ id: '', name: '', type: 'sales', amount: 0, description: '' });
  const [activeTariffTab, setActiveTariffTab] = useState<'pengurusan' | 'trucking'>('pengurusan');
  const [isOpenTariffModal, setIsOpenTariffModal] = useState(false);
  const [tariffFormEx, setTariffFormEx] = useState({
    id: '',
    customerId: '',
    serviceType: '',
    unit: '',
    origin: '',
    destination: '',
    fleetType: '',
    amount: 0,
    pocketMoney: 0,
    description: ''
  });
  const [fleetForm, setFleetForm] = useState({ id: '', licensePlate: '', model: '', type: 'Tronton', status: 'ready' });
  const [driverForm, setDriverForm] = useState({ id: '', name: '', phone: '', licenseNo: '', status: 'available' });
  
  const [joForm, setJoForm] = useState({ id: '', customerId: '', origin: '', destination: '', tariffId: '', status: 'pending' });
  const [spkForm, setSpkForm] = useState({ id: '', jobOrderId: '', driverId: '', fleetId: '', status: 'assigned', pocketMoney: 0, fuelAllowance: 0 });
  const [invoiceForm, setInvoiceForm] = useState({ id: '', jobOrderId: '', amount: 0, taxRate: 11, taxAmount: 0, totalAmount: 0, status: 'unpaid' });

  // REVIP ERP JOB ORDER REVAMP STATES
  const [joActiveFilter, setJoActiveFilter] = useState<'Semua' | 'Draft' | 'Berjalan' | 'Selesai' | 'Batal'>('Semua');
  const [expandedJoId, setExpandedJoId] = useState<string | null>(null);
  
  const initialJoFullForm = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    clientPoRef: '',
    origin: '',
    destination: '',
    fleetType: 'Tronton',
    cargoDescription: '',
    status: 'Draft', // 'Draft' | 'Berjalan' | 'Selesai' | 'Batal'

    // Blok Finansial 1: Inklaring & Pengurusan (Forwarding)
    billingInklaring: [
      { id: '1', serviceName: 'Customs Clearance Impor', qty: 1, unitPrice: 2500000, total: 2500000 }
    ],
    costsInklaring: [
      { id: '1', category: 'Sewa Genset / Reefer', providerName: 'PT Sarana Genset Mandiri', description: 'Monitoring 24 jam', amount: 750000 }
    ],

    // Blok Finansial 2: Trucking
    billingTrucking: [
      { id: '1', routeName: 'Tj. Priok ke Cikarang', qty: 1, unitPrice: 3500000, total: 3500000 }
    ],
    costsTrucking: [
      { id: '1', costType: 'Internal', providerName: 'Supir Sulaeman', nopol: 'B 9283 UI', amount: 850000 }
    ],

    // Blok Finansial 3: Reimbursement (Talangan Murni - Jual = Beli)
    reimbursements: [
      { id: '1', description: 'PNBP Bea Cukai', amount: 220000, receiptNumber: 'STR-7721' }
    ]
  };

  const [joFullForm, setJoFullForm] = useState(initialJoFullForm);

  const MOCK_VENDORS = [
    { id: 'VND-001', name: 'PT Sarana Genset Mandiri', category: 'Genset' },
    { id: 'VND-002', name: 'PT Indonesia Terminal Depo', category: 'Depo' },
    { id: 'VND-003', name: 'PT Samudra Ocean Line', category: 'Pelayaran' },
    { id: 'VND-004', name: 'Koperasi Supir Pantura', category: 'Supir' },
    { id: 'VND-005', name: 'CV Berkah Nopol Truk Mandiri', category: 'Trucking Partner' }
  ];

  // Handle generic delete action with mandatory confirmation dialog
  const handleDelete = async (collectionName: string, id: string) => {
    const confirmation = window.confirm("Yakin ingin menghapus data?");
    if (!confirmation) return;
    
    setLoadingAction(true);
    try {
      await deleteEntity(collectionName, id);
    } catch (err) {
      alert("Gagal menghapus data: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove contacts list with confirmation
  const removeContact = (index: number) => {
    const confirmRemove = window.confirm('Yakin ingin menghapus kontak ini?');
    if (confirmRemove) {
      setCustomerForm(prev => ({
        ...prev,
        pics: prev.pics.filter((_, i) => i !== index)
      }));
    }
  };

  // Generic Submit Handlers
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      if (editingId) {
        await updateEntity('customers', editingId, {
          name: customerForm.name,
          companyName: customerForm.companyName,
          email: customerForm.email,
          phone: customerForm.phone,
          address: customerForm.address,
          status: customerForm.status,
          customerGroup: customerForm.customerGroup,
          npwp: customerForm.npwp,
          top: customerForm.top,
          billingAddress: customerForm.billingAddress,
          pics: customerForm.pics,
        });
      } else {
        await addEntity('customers', {
          ...customerForm,
          createdAt: new Date().toISOString()
        });
      }
      setCustomerForm({
        id: '',
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
        customerGroup: '',
        npwp: '',
        top: '7 Hari',
        billingAddress: '',
        pics: []
      });
      setEditingId(null);
      setSubTab('list');
    } catch (err) {
      alert("Error saving customer: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleParameterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addEntity('parameters', {
        ...parameterForm,
        updatedAt: new Date().toISOString()
      });
      setParameterForm({ id: '', key: '', value: '', category: 'OPERASIONAL', description: '' });
      setSubTab('list');
    } catch (err) {
      alert("Error adding parameter: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTariffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addEntity('tariffs', {
        ...tariffForm,
        amount: Number(tariffForm.amount)
      });
      setTariffForm({ id: '', name: '', type: 'sales', amount: 0, description: '' });
      setSubTab('list');
    } catch (err) {
      alert("Error adding tariff: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTariffSubmitEx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tariffFormEx.customerId) {
      alert("Silakan pilih Pelanggan terlebih dahulu.");
      return;
    }
    
    setLoadingAction(true);
    try {
      const customerObj = customers.find(c => c.id === tariffFormEx.customerId);
      const customerCompanyName = customerObj ? customerObj.companyName : 'Umum';
      
      let generatedName = '';
      const payload: any = {
        customerId: tariffFormEx.customerId,
        amount: Number(tariffFormEx.amount),
        description: tariffFormEx.description || '',
        type: 'sales', // Strictly sales pricing as mandated
      };

      if (activeTariffTab === 'pengurusan') {
        generatedName = `${customerCompanyName} - ${tariffFormEx.serviceType || 'Jasa'} (${tariffFormEx.unit || 'Dokumen'})`;
        payload.category = 'pengurusan';
        payload.serviceType = tariffFormEx.serviceType;
        payload.unit = tariffFormEx.unit;
        payload.name = generatedName;
        // Reset trucking parameters
        payload.origin = '';
        payload.destination = '';
        payload.fleetType = '';
        payload.pocketMoney = 0;
      } else {
        generatedName = `${customerCompanyName} - Trucking ${tariffFormEx.origin} s/d ${tariffFormEx.destination} [${tariffFormEx.fleetType}]`;
        payload.category = 'trucking';
        payload.origin = tariffFormEx.origin;
        payload.destination = tariffFormEx.destination;
        payload.fleetType = tariffFormEx.fleetType;
        payload.pocketMoney = Number(tariffFormEx.pocketMoney);
        payload.name = generatedName;
        // Reset pengurusan parameters
        payload.serviceType = '';
        payload.unit = '';
      }

      if (editingId) {
        await updateEntity('tariffs', editingId, payload);
      } else {
        // Create new ID
        const prefix = activeTariffTab === 'pengurusan' ? 'TRF-PGS' : 'TRF-TRK';
        const randomIdSuffix = Math.floor(1000 + Math.random() * 9000);
        const generatedId = `${prefix}-${randomIdSuffix}`;
        payload.id = generatedId;
        await addEntity('tariffs', payload);
      }

      // Reset Form & Close Modal
      setIsOpenTariffModal(false);
      setEditingId(null);
      setTariffFormEx({
        id: '',
        customerId: '',
        serviceType: '',
        unit: '',
        origin: '',
        destination: '',
        fleetType: '',
        amount: 0,
        pocketMoney: 0,
        description: ''
      });
    } catch (err) {
      alert("Error menyimpan tarif: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFleetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addEntity('fleets', fleetForm);
      setFleetForm({ id: '', licensePlate: '', model: '', type: 'Tronton', status: 'ready' });
      setSubTab('list');
    } catch (err) {
      alert("Error adding fleet: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addEntity('drivers', driverForm);
      setDriverForm({ id: '', name: '', phone: '', licenseNo: '', status: 'available' });
      setSubTab('list');
    } catch (err) {
      alert("Error adding driver: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJobOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joFullForm.customerId) {
      alert("Silakan pilih Pelanggan terlebih dahulu.");
      return;
    }
    
    setLoadingAction(true);
    try {
      const payload = {
        ...joFullForm,
        id: joFullForm.id.trim().toUpperCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString()
      };

      if (editingId) {
        await updateEntity('jobOrders', editingId, payload);
      } else {
        await addEntity('jobOrders', payload);
      }

      // Reset form and return
      setJoFullForm({
        id: '',
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        clientPoRef: '',
        origin: '',
        destination: '',
        fleetType: 'Tronton',
        cargoDescription: '',
        status: 'Draft',
        billingInklaring: [
          { id: '1', serviceName: 'Customs Clearance Impor', qty: 1, unitPrice: 2500000, total: 2500000 }
        ],
        costsInklaring: [
          { id: '1', category: 'Sewa Genset / Reefer', providerName: 'PT Sarana Genset Mandiri', description: 'Monitoring 24 jam', amount: 750000 }
        ],
        billingTrucking: [
          { id: '1', routeName: 'Tj. Priok ke Cikarang', qty: 1, unitPrice: 3500000, total: 3500000 }
        ],
        costsTrucking: [
          { id: '1', costType: 'Internal', providerName: 'Supir Sulaeman', nopol: 'B 9283 UI', amount: 850000 }
        ],
        reimbursements: [
          { id: '1', description: 'PNBP Bea Cukai', amount: 220000, receiptNumber: 'STR-7721' }
        ]
      });
      setEditingId(null);
      setSubTab('list');
    } catch (err) {
      alert("Gagal menyimpan Job Order: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  // ROW ADAPTER FUNCTIONS FOR DYNAMIC REPEATERS
  // 1A. Billing Inklaring (Tagihan Inklaring)
  const addBillingInklaringRow = () => {
    const newId = Math.random().toString().slice(2, 6);
    setJoFullForm(prev => ({
      ...prev,
      billingInklaring: [
        ...prev.billingInklaring,
        { id: newId, serviceName: '', qty: 1, unitPrice: 0, total: 0 }
      ]
    }));
  };

  const removeBillingInklaringRow = (id: string) => {
    setJoFullForm(prev => ({
      ...prev,
      billingInklaring: prev.billingInklaring.length > 1 
        ? prev.billingInklaring.filter(item => item.id !== id)
        : prev.billingInklaring
    }));
  };

  const updateBillingInklaringRow = (id: string, field: string, value: any) => {
    setJoFullForm(prev => {
      const updated = prev.billingInklaring.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const q = field === 'qty' ? Number(value) : Number(item.qty || 0);
          const p = field === 'unitPrice' ? Number(value) : Number(item.unitPrice || 0);
          updatedItem.total = q * p;
          return updatedItem;
        }
        return item;
      });
      return { ...prev, billingInklaring: updated };
    });
  };

  // 1B. Costs Inklaring (Biaya Vendor Inklaring)
  const addCostsInklaringRow = () => {
    const newId = Math.random().toString().slice(2, 6);
    setJoFullForm(prev => ({
      ...prev,
      costsInklaring: [
        ...prev.costsInklaring,
        { id: newId, category: '', providerName: '', description: '', amount: 0 }
      ]
    }));
  };

  const removeCostsInklaringRow = (id: string) => {
    setJoFullForm(prev => ({
      ...prev,
      costsInklaring: prev.costsInklaring.length > 1
        ? prev.costsInklaring.filter(item => item.id !== id)
        : prev.costsInklaring
    }));
  };

  const updateCostsInklaringRow = (id: string, field: string, value: any) => {
    setJoFullForm(prev => ({
      ...prev,
      costsInklaring: prev.costsInklaring.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // 2A. Billing Trucking (Tagihan Trucking)
  const addBillingTruckingRow = () => {
    const newId = Math.random().toString().slice(2, 6);
    setJoFullForm(prev => ({
      ...prev,
      billingTrucking: [
        ...prev.billingTrucking,
        { id: newId, routeName: '', qty: 1, unitPrice: 0, total: 0 }
      ]
    }));
  };

  const removeBillingTruckingRow = (id: string) => {
    setJoFullForm(prev => ({
      ...prev,
      billingTrucking: prev.billingTrucking.length > 1
        ? prev.billingTrucking.filter(item => item.id !== id)
        : prev.billingTrucking
    }));
  };

  const updateBillingTruckingRow = (id: string, field: string, value: any) => {
    setJoFullForm(prev => {
      const updated = prev.billingTrucking.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const q = field === 'qty' ? Number(value) : Number(item.qty || 0);
          const p = field === 'unitPrice' ? Number(value) : Number(item.unitPrice || 0);
          updatedItem.total = q * p;
          return updatedItem;
        }
        return item;
      });
      return { ...prev, billingTrucking: updated };
    });
  };

  // 2B. Costs Trucking (Biaya Truk / Uang Jalan Supir)
  const addCostsTruckingRow = () => {
    const newId = Math.random().toString().slice(2, 6);
    setJoFullForm(prev => ({
      ...prev,
      costsTrucking: [
        ...prev.costsTrucking,
        { id: newId, costType: 'Internal', providerName: '', nopol: '', amount: 0 }
      ]
    }));
  };

  const removeCostsTruckingRow = (id: string) => {
    setJoFullForm(prev => ({
      ...prev,
      costsTrucking: prev.costsTrucking.length > 1
        ? prev.costsTrucking.filter(item => item.id !== id)
        : prev.costsTrucking
    }));
  };

  const updateCostsTruckingRow = (id: string, field: string, value: any) => {
    setJoFullForm(prev => ({
      ...prev,
      costsTrucking: prev.costsTrucking.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // 3. Reimbursement
  const addReimbursementRow = () => {
    const newId = Math.random().toString().slice(2, 6);
    setJoFullForm(prev => ({
      ...prev,
      reimbursements: [
        ...prev.reimbursements,
        { id: newId, description: '', amount: 0, receiptNumber: '' }
      ]
    }));
  };

  const removeReimbursementRow = (id: string) => {
    setJoFullForm(prev => ({
      ...prev,
      reimbursements: prev.reimbursements.length > 1
        ? prev.reimbursements.filter(item => item.id !== id)
        : prev.reimbursements
    }));
  };

  const updateReimbursementRow = (id: string, field: string, value: any) => {
    setJoFullForm(prev => ({
      ...prev,
      reimbursements: prev.reimbursements.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSpkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addEntity('spks', {
        ...spkForm,
        pocketMoney: Number(spkForm.pocketMoney),
        fuelAllowance: Number(spkForm.fuelAllowance),
        createdAt: new Date().toISOString()
      });
      setSpkForm({ id: '', jobOrderId: '', driverId: '', fleetId: '', status: 'assigned', pocketMoney: 0, fuelAllowance: 0 });
      setSubTab('list');
    } catch (err) {
      alert("Error adding SPK: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    
    // Automatically calculate tax parameters
    const amt = Number(invoiceForm.amount);
    const taxRate = Number(invoiceForm.taxRate);
    const taxAmt = (amt * taxRate) / 100;
    const total = amt + taxAmt;

    try {
      await addEntity('invoices', {
        ...invoiceForm,
        amount: amt,
        taxRate: taxRate,
        taxAmount: taxAmt,
        totalAmount: total,
        createdAt: new Date().toISOString()
      });
      setInvoiceForm({ id: '', jobOrderId: '', amount: 0, taxRate: 11, taxAmount: 0, totalAmount: 0, status: 'unpaid' });
      setSubTab('list');
    } catch (err) {
      alert("Error adding invoice: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper formatting for currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // ID validation & format handler
  const handleIdChange = (val: string) => {
    // Tolak input angka/simbol, keep only a-z A-Z letters
    const cleared = val.replace(/[^a-zA-Z]/g, '');
    const truncated = cleared.slice(0, 3);
    setCustomerForm(prev => ({ ...prev, id: truncated.toUpperCase() }));
  };

  // NPWP validation & format handler
  const handleNpwpChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setCustomerForm(prev => ({ ...prev, npwp: numeric.slice(0, 16) }));
  };

  // Toggle row accordion
  const toggleRow = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setExpandedCustomerId(prev => prev === id ? null : id);
  };

  // RENDER SELECTION BY MODULE ID
  switch (moduleId) {
    case 'master-customers':
      return <CustomerView />;
    case 'master-vendors':
      return <VendorView />;
    case 'master-drivers':
      return <DriverView />;
    case 'master-trucks':
      return <TruckView />;

    case 'database-pelanggan': {
      const filtered = customers.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || c.status === filterStatus.toLowerCase();
        return matchesSearch && matchesFilter;
      });

      if (activeSubTab === 'list') {
        return (
          <div className="space-y-4">
            {/* COMPACT TOOLBAR - NO LARGE HEADINGS */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-4">
              <button
                onClick={() => {
                  setCustomerForm({
                    id: '',
                    name: '',
                    companyName: '',
                    email: '',
                    phone: '',
                    address: '',
                    status: 'active',
                    customerGroup: '',
                    npwp: '',
                    top: '7 Hari',
                    billingAddress: '',
                    pics: []
                  });
                  setEditingId(null);
                  setSubTab('input');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-colors"
                title="Tambah Pelanggan Baru"
              >
                <Plus className="w-4 h-4 text-white font-extrabold" />
                <span>Tambah Pelanggan</span>
              </button>
              
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    className="bg-transparent font-semibold text-slate-600 outline-none cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari ID, Nama, PT..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* FULL-WIDTH ACCORDION TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4">ID Pelanggan</th>
                    <th className="p-4">Nama Penuh</th>
                    <th className="p-4">Nama Perusahaan</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Telepon</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {loadingData?.customers ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 font-normal">
                        <div className="flex items-center justify-center space-x-2 py-4">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          <span className="font-semibold text-slate-500">Memuat data pelanggan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 font-normal">
                        Belum ada data pelanggan yang terdaftar di database Firestore.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={(e) => toggleRow(item.id, e)}
                          className="hover:bg-slate-50/70 active:bg-slate-100/40 cursor-pointer transition duration-150"
                        >
                          <td className="p-4 font-mono text-blue-600">{item.id}</td>
                          <td className="p-4">{item.name}</td>
                          <td className="p-4 text-slate-900">{item.companyName}</td>
                          <td className="p-4 font-normal text-slate-500">{item.email || '-'}</td>
                          <td className="p-4 font-mono text-slate-600">{item.phone || '-'}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {item.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCustomerId(prev => prev === item.id ? null : item.id);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-transparent transition"
                              >
                                {expandedCustomerId === item.id ? 'Tutup' : 'Detail'}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete('customers', item.id);
                                }}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                                title="Hapus Pelanggan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* EXPANDABLE ROW QUICK VIEW */}
                        {expandedCustomerId === item.id && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={7} className="p-5 border-b border-slate-250 align-top">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                                
                                {/* Info Panel - Left Column */}
                                <div className="space-y-3.5 text-slate-700">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Rangkuman Profil Pelanggan</h4>
                                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-105 font-mono">
                                      ID: {item.id}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-y-2.5 text-xs text-slate-600 font-semibold">
                                    <span className="text-slate-400 font-medium">Customer Group:</span>
                                    <span className="col-span-2 text-slate-800 font-bold">{item.customerGroup || 'Umum'}</span>
                                    
                                    <span className="text-slate-400 font-medium">No. NPWP:</span>
                                    <span className="col-span-2 text-slate-800 font-mono font-bold">
                                      {item.npwp ? item.npwp.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, "$1.$2.$3.$4-$5.$6") : '-'}
                                    </span>

                                    <span className="text-slate-400 font-medium">Syarat Penagihan TOP:</span>
                                    <span className="col-span-2 text-amber-600 font-bold">{item.top || '7 Hari'}</span>

                                    <span className="text-slate-400 font-medium">Alamat Kantor:</span>
                                    <span className="col-span-2 text-slate-700 leading-relaxed">{item.address || '-'}</span>

                                    <span className="text-slate-400 font-medium">Alamat Penagihan:</span>
                                    <span className="col-span-2 text-slate-700 leading-relaxed font-semibold">{item.billingAddress || item.address || '-'}</span>
                                  </div>

                                  <div className="pt-2">
                                    <button
                                      onClick={() => {
                                        setCustomerForm({
                                          id: item.id || '',
                                          name: item.name || '',
                                          companyName: item.companyName || '',
                                          email: item.email || '',
                                          phone: item.phone || '',
                                          address: item.address || '',
                                          status: item.status || 'active',
                                          customerGroup: item.customerGroup || '',
                                          npwp: item.npwp || '',
                                          top: item.top || '7 Hari',
                                          billingAddress: item.billingAddress || '',
                                          pics: item.pics || []
                                        });
                                        setEditingId(item.id);
                                        setSubTab('input');
                                      }}
                                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-white font-extrabold" />
                                      <span>Edit Data Pelanggan</span>
                                    </button>
                                  </div>
                                </div>

                                {/* PIC Contacts Panel - Right Column */}
                                <div className="space-y-3 pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100">
                                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Daftar PIC Terdaftar ({item.pics?.length || 0})</h4>
                                  
                                  {(!item.pics || item.pics.length === 0) ? (
                                    <div className="text-xs text-slate-400 bg-slate-50 border border-slate-150 p-4 rounded-xl italic">
                                      Belum ada kontak PIC yang didaftarkan untuk klien ini.
                                    </div>
                                  ) : (
                                    <div className="space-y-2 max-h-52 overflow-y-auto">
                                      {item.pics.map((pic: any, idx: number) => (
                                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-205 flex items-start justify-between text-xs font-semibold">
                                          <div className="space-y-0.5">
                                            <div className="flex items-center space-x-1.5 flex-wrap">
                                              <span className="font-bold text-slate-850">{pic.name}</span>
                                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-bold border border-blue-100 uppercase">
                                                {pic.role}
                                              </span>
                                            </div>
                                            <div className="text-slate-500 text-[11px] font-medium mt-1">
                                              Email: {pic.email || '-'} | Telp: <span className="font-mono">{pic.phone || '-'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      return (
        <form onSubmit={handleCustomerSubmit} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              {editingId ? `Edit Data Pelanggan: ${editingId}` : 'Formulir Tambah Pelanggan Baru'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Isi informasi profil penagihan logistik dan person-in-charge secara akurat.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID Customer (3 Letters, Alpha-Only, upper case) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ID Customer (Maks 3 Huruf, Auto-Uppercase) *</label>
              <input 
                required
                disabled={!!editingId}
                type="text" 
                placeholder="ABC"
                className={`w-full ${editingId ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'} rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition font-semibold font-mono`}
                value={customerForm.id}
                onChange={(e) => handleIdChange(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status Aktif</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.status}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Nama Customer Standard text (Required) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nama Kontak Utama *</label>
              <input 
                required
                type="text" 
                placeholder="Bp. Mochamad Ray"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nama Perusahaan *</label>
              <input 
                required
                type="text" 
                placeholder="PT Tri Adi Bersama"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.companyName}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>

            {/* Customer Group auto-suggest */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Customer Group (Auto-Suggest)</label>
              <input 
                type="text" 
                placeholder="Ketik Cargo, Retail, FMCG..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.customerGroup}
                onChange={(e) => {
                  setCustomerForm(prev => ({ ...prev, customerGroup: e.target.value }));
                  setShowGroupSuggestions(true);
                }}
                onFocus={() => setShowGroupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 200)}
              />
              {showGroupSuggestions && (
                <div className="absolute z-10 w-full bg-white border border-slate-250 shadow-lg rounded-xl mt-1 text-xs divide-y divide-slate-100 overflow-hidden font-semibold">
                  {['Corporate Cargo', 'Retail Logistics', 'Distributor FMCG', 'Industrial Client', 'Mining & Resources', 'E-Commerce Agent']
                    .filter(grp => grp.toLowerCase().includes(customerForm.customerGroup.toLowerCase()))
                    .map((grp) => (
                      <div 
                        key={grp}
                        onMouseDown={() => setCustomerForm(prev => ({ ...prev, customerGroup: grp }))}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer transition text-slate-700"
                      >
                        {grp}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* No NPWP Numeric Only length = 15-16 */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">No. NPWP Pajak (15-16 Digit Angka) *</label>
              <input 
                required
                type="text" 
                pattern="\d{15,16}"
                title="Bentuk NPWP harus berupa angka 15 atau 16 digit"
                placeholder="Angka Saja (Contoh: 123456789012345)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.npwp}
                onChange={(e) => handleNpwpChange(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Syarat Pembayaran (TOP) *</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.top}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, top: e.target.value }))}
              >
                <option value="7 Hari">7 Hari</option>
                <option value="14 Hari">14 Hari</option>
                <option value="30 Hari">30 Hari</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Email</label>
              <input 
                type="email" 
                placeholder="customer@tabs.co.id"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.email}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">No Telepon / WA</label>
              <input 
                type="text" 
                placeholder="+628123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Kantor Pelanggan</label>
              <textarea 
                rows={3}
                placeholder="Gedung Logistics Lantai 4, Jakarta Barat"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.address}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat Penagihan (Billing Address)</label>
              <textarea 
                rows={3}
                placeholder="Ketik alamat penagihan jika berbeda dengan alamat kantor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-slate-800"
                value={customerForm.billingAddress}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, billingAddress: e.target.value }))}
              />
            </div>
          </div>

          {/* DYNAMIC PIC REPEATER */}
          <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Daftar Kontak Person (PIC)</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Daftarkan beberapa personal penghubung untuk penagihan atau operasional perjalanan.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomerForm(prev => ({
                    ...prev,
                    pics: [...prev.pics, { role: '', name: '', email: '', phone: '' }]
                  }));
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition"
              >
                <Plus className="w-4 h-4 text-blue-600 font-extrabold" />
                <span>Tambah PIC</span>
              </button>
            </div>

            {customerForm.pics.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                Belum ada kontak PIC tambahan. Klik "+ Tambah PIC" ke daftar kontak pelanggan.
              </div>
            ) : (
              <div className="space-y-3">
                {customerForm.pics.map((pic, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Peran / Jabatan *</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Contoh: Manager Keuangan"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700"
                        value={pic.role}
                        onChange={(e) => {
                          const updatedPics = [...customerForm.pics];
                          updatedPics[idx].role = e.target.value;
                          setCustomerForm(prev => ({ ...prev, pics: updatedPics }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Nama Lengkap *</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Nama PIC Lengkap"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700"
                        value={pic.name}
                        onChange={(e) => {
                          const updatedPics = [...customerForm.pics];
                          updatedPics[idx].name = e.target.value;
                          setCustomerForm(prev => ({ ...prev, pics: updatedPics }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Email PIC</label>
                      <input 
                        type="email" 
                        placeholder="pic@domain.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700"
                        value={pic.email}
                        onChange={(e) => {
                          const updatedPics = [...customerForm.pics];
                          updatedPics[idx].email = e.target.value;
                          setCustomerForm(prev => ({ ...prev, pics: updatedPics }));
                        }}
                      />
                    </div>
                    <div className="space-y-1 relative pr-8">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">No Tlp / WA</label>
                      <input 
                        type="text" 
                        placeholder="0812xxxxxx"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700"
                        value={pic.phone}
                        onChange={(e) => {
                          const updatedPics = [...customerForm.pics];
                          updatedPics[idx].phone = e.target.value;
                          setCustomerForm(prev => ({ ...prev, pics: updatedPics }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="absolute top-6 right-2 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded transition border border-transparent hover:border-red-200 shadow-xs"
                        title="Hapus PIC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORM ACTIONS RIGHT BOTTOM POSITIONED */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => {
                setEditingId(null);
                setSubTab('list');
              }}
              className="px-4.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loadingAction}
              className="px-5.5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm shadow-blue-200 hover:shadow-md transition-all"
            >
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Simpan Pelanggan</span>}
            </button>
          </div>
        </form>
      );
    }

    case 'master-parameter': {
      // Filter from master_parameters (linked dynamically via onSnapshot)
      // category-match + search-query match
      const filtered = (master_parameters || []).filter(item => {
        const matchesCategory = item.category === selectedCategory;
        const matchesSearch = searchQuery.trim() === '' || 
          item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      const activeCategoryObj = MASTER_CATEGORIES.find(c => c.id === selectedCategory) || MASTER_CATEGORIES[0];

      // Custom actions local inside ModuleContent
      const handleCategoryChange = (catId: string) => {
        setCategoryLoading(true);
        setSelectedCategory(catId);
        setTimeout(() => {
          setCategoryLoading(false);
        }, 300); // 300ms nice loading transitions
      };

      const handleMasterParamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!masterParamForm.code.trim() || !masterParamForm.name.trim()) {
          alert("Kode dan Nama wajib diisi.");
          return;
        }
        setLoadingAction(true);
        try {
          const generatedId = `${selectedCategory}_${masterParamForm.code.trim().toLowerCase()}`;
          await addEntity('master_parameters', {
            id: generatedId,
            category: selectedCategory,
            code: masterParamForm.code.trim().toUpperCase(),
            name: masterParamForm.name.trim()
          });
          setMasterParamForm({ code: '', name: '' });
          setIsOpenMasterModal(false);
        } catch (err) {
          alert("Gagal menambahkan parameter: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setLoadingAction(false);
        }
      };

      const handleMasterParamDelete = async (id: string) => {
        const confirmation = window.confirm('Yakin ingin menghapus parameter ini?');
        if (!confirmation) return;
        
        setLoadingAction(true);
        try {
          await deleteEntity('master_parameters', id);
        } catch (err) {
          alert("Gagal menghapus parameter: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setLoadingAction(false);
        }
      };

      return (
        <div className="flex flex-col md:flex-row gap-6 items-start h-full">
          {/* Panel Kiri: Navigasi Kategori (25% lebar) */}
          <div className="w-full md:w-1/4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 shrink-0">
            <h3 className="text-slate-800 font-extrabold text-[11px] tracking-widest uppercase border-b border-slate-100 pb-2 mb-2">
              Navigasi Kategori
            </h3>
            <div className="flex flex-col space-y-1.5" id="category-navigation">
              {MASTER_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    id={`btn-cat-${cat.id}`}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex flex-col space-y-1 transition duration-150 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs animate-pulse-once' 
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
                    }`}
                  >
                    <span className="font-bold">{cat.name}</span>
                    <span className={`text-[10px] font-normal leading-relaxed ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Kanan: Tabel Data & Kontrol (75% lebar) */}
          <div className="w-full md:w-3/4 space-y-4">
            {selectedCategory === 'pajak' ? (
              <TaxSettings />
            ) : (
              <>
                {/* Control Area */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                  <button
                    type="button"
                    id="btn-add-master-param"
                    onClick={() => {
                      setMasterParamForm({ code: '', name: '' });
                      setIsOpenMasterModal(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow-sm transition-all w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4 text-white font-extrabold" />
                    <span>+ Tambah Data</span>
                  </button>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="search-master-param"
                      type="text"
                      placeholder={`Cari di ${activeCategoryObj.name}...`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table Area with Border-Clean styling */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="master-parameters-table-container">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <span>Tabel Parameter: {activeCategoryObj.name}</span>
                    </h4>
                    <span className="text-[10px] bg-slate-200/80 font-bold px-2 py-0.5 rounded-md text-slate-600 font-mono">
                      {filtered.length} Record
                    </span>
                  </div>

                  {categoryLoading || loadingData?.master_parameters ? (
                    /* Indikator Loading Spinner */
                    <div className="p-16 flex flex-col items-center justify-center space-y-3" id="table-loading-indicator">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-500">Memuat data dari database Firestore...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700" id="master-table">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            {/* Bersih: hilangkan garis batas vertikal, gunakan garis horizontal tipis */}
                            <th className="p-4 border-b border-slate-200 font-bold">ID</th>
                            <th className="p-4 border-b border-slate-200 font-bold">Kode Parameter</th>
                            <th className="p-4 border-b border-slate-200 font-bold">Nama / Keterangan</th>
                            <th className="p-4 border-b border-slate-200 text-right font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center p-12 text-slate-400 font-normal">
                                Belum ada parameter {activeCategoryObj.name} yang terdaftar di database Firestore.
                              </td>
                            </tr>
                          ) : (
                            filtered.map((item) => (
                              <tr 
                                key={item.id} 
                                id={`row-${item.id}`}
                                className="hover:bg-slate-50/50 active:bg-slate-100/40 transition duration-150"
                              >
                                <td className="p-4 font-mono text-slate-400 text-[10px] font-normal">{item.id}</td>
                                <td className="p-4 font-mono text-blue-600 font-bold">{item.code}</td>
                                <td className="p-4 text-slate-900 font-semibold">{item.name}</td>
                                <td className="p-4 text-right">
                                  <button
                                    type="button"
                                    id={`delete-btn-${item.id}`}
                                    onClick={() => handleMasterParamDelete(item.id)}
                                    className="inline-flex items-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-transparent hover:border-red-200 hover:shadow-xs transition duration-150"
                                    title="Hapus Parameter ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Form Input Modal Pop-up Cepat */}
          <Modal
            isOpen={isOpenMasterModal}
            onClose={() => setIsOpenMasterModal(false)}
            title={`Tambah Parameter: ${activeCategoryObj.name}`}
          >
            <form onSubmit={handleMasterParamSubmit} className="space-y-4" id="master-param-form">
              <div className="bg-blue-50/50 px-4 py-3 rounded-lg border border-blue-100/60 mb-2">
                <span className="text-[11px] font-bold text-blue-800 uppercase block mb-0.5">Kategori Aktif</span>
                <span className="text-xs font-semibold text-slate-700">{activeCategoryObj.name}</span>
                {/* Sisipkan kategori secara tersembunyi */}
                <input type="hidden" name="category" value={selectedCategory} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Kode Parameter (Maks 10 Karakter, Auto-Uppercase) *
                </label>
                <input
                  id="input-code"
                  required
                  type="text"
                  maxLength={10}
                  placeholder="E.g. HD94_A1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-slate-800"
                  value={masterParamForm.code}
                  onChange={(e) => {
                    const cleanCode = e.target.value.toUpperCase().slice(0, 10).replace(/[^A-Z0-9_-]/g, '');
                    setMasterParamForm(prev => ({ ...prev, code: cleanCode }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Nama / Keterangan *
                </label>
                <input
                  id="input-name"
                  required
                  type="text"
                  placeholder="Keterangan lengkap parameter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-slate-800"
                  value={masterParamForm.name}
                  onChange={(e) => setMasterParamForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpenMasterModal(false)}
                  className="px-4.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5.5 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition"
                >
                  {loadingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      );
    }

    case 'tarif-jual-biaya': {
      return <MasterTarifView />;
      const filteredTariffs = tariffs.filter(t => {
        const isPengurusan = t.category !== 'trucking' && !t.origin && !t.destination;
        if (activeTariffTab === 'pengurusan') {
          if (!isPengurusan) return false;
        } else {
          if (isPengurusan) return false;
        }
        
        // Search Query Filter
        const q = searchQuery.toLowerCase();
        const customerObj = customers.find(c => c.id === t.customerId);
        const customerText = customerObj ? `${customerObj.companyName} ${customerObj.name}` : '';
        
        return (
          t.name?.toLowerCase().includes(q) ||
          t.serviceType?.toLowerCase().includes(q) ||
          t.unit?.toLowerCase().includes(q) ||
          t.origin?.toLowerCase().includes(q) ||
          t.destination?.toLowerCase().includes(q) ||
          t.fleetType?.toLowerCase().includes(q) ||
          customerText.toLowerCase().includes(q)
        );
      });

      return (
        <div className="space-y-6 animate-fade-in" id="tarif-jual-biaya-container">
          {/* Sistem 2 Tab Statis */}
          <div className="flex border-b border-slate-200 bg-white rounded-lg p-1.5 shadow-xs space-x-2" id="tariff-tabs">
            <button
              type="button"
              onClick={() => {
                setActiveTariffTab('pengurusan');
                setSearchQuery('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTariffTab === 'pengurusan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tab 1: Jasa Pengurusan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTariffTab('trucking');
                setSearchQuery('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTariffTab === 'trucking'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Tab 2: Trucking</span>
            </button>
          </div>

          {/* Control Bar dengan "+ Tambah Tarif" & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="tariff-control-bar">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTariffFormEx({
                  id: '',
                  customerId: '',
                  serviceType: '',
                  unit: '',
                  origin: '',
                  destination: '',
                  fleetType: '',
                  amount: 0,
                  pocketMoney: 0,
                  description: ''
                });
                setIsOpenTariffModal(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tarif</span>
            </button>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={activeTariffTab === 'pengurusan' ? "Cari Pelanggan, Jenis Layanan..." : "Cari Pelanggan, Rute..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* TABEL DATA */}
          {activeTariffTab === 'pengurusan' ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4 font-semibold">Pelanggan</th>
                    <th className="p-4 font-semibold">Jenis Layanan</th>
                    <th className="p-4 font-semibold">Satuan</th>
                    <th className="p-4 font-semibold text-right">Tarif Jual Standar</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTariffs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-12 text-slate-400 font-normal">
                        Belum ada daftar tarif Jasa Pengurusan yang tercatat. Telusuri data lain atau tambahkan data baru.
                      </td>
                    </tr>
                  ) : (
                    filteredTariffs.map((item) => {
                      const cust = customers.find(c => c.id === item.customerId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-semibold text-slate-900">
                            {cust ? (
                              <div>
                                <div className="font-extrabold text-slate-900">{cust.companyName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{cust.name}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-normal">General / Non-Customer</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-100">
                              {item.serviceType || item.name || '-'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-bold">{item.unit || '-'}</td>
                          <td className="p-4 font-mono text-slate-900 text-right font-extrabold bg-slate-55/20">
                            {formatIDR(item.amount)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setTariffFormEx({
                                    id: item.id,
                                    customerId: item.customerId || '',
                                    serviceType: item.serviceType || '',
                                    unit: item.unit || '',
                                    origin: item.origin || '',
                                    destination: item.destination || '',
                                    fleetType: item.fleetType || '',
                                    amount: item.amount || 0,
                                    pocketMoney: item.pocketMoney || 0,
                                    description: item.description || ''
                                  });
                                  setIsOpenTariffModal(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded border border-transparent hover:border-blue-100 transition"
                                title="Edit Tarif"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDelete('tariffs', item.id)}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                                title="Hapus Tarif"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4 font-semibold">Pelanggan</th>
                    <th className="p-4 font-semibold">Rute (Asal - Tujuan)</th>
                    <th className="p-4 font-semibold">Tipe Armada</th>
                    <th className="p-4 font-semibold text-right">Tarif Jual Standar</th>
                    <th className="p-4 font-semibold text-right">Uang Jalan Supir</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTariffs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-slate-400 font-normal">
                        Belum ada daftar tarif trucking yang tercatat. Telusuri data lain atau tambahkan data baru.
                      </td>
                    </tr>
                  ) : (
                    filteredTariffs.map((item) => {
                      const cust = customers.find(c => c.id === item.customerId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-semibold text-slate-900">
                            {cust ? (
                              <div>
                                <div className="font-extrabold text-slate-900">{cust.companyName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{cust.name}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-normal">General / Non-Customer</span>
                            )}
                          </td>
                          <td className="p-4 font-semibold">
                            <div className="flex items-center space-x-2 text-slate-800">
                              <span className="font-bold text-blue-700 bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded">
                                {item.origin || '-'}
                              </span>
                              <span className="text-slate-400 font-bold">➔</span>
                              <span className="font-bold text-green-700 bg-green-50/50 border border-green-100 px-2 py-0.5 rounded">
                                {item.destination || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold">
                            <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100">
                              {item.fleetType || item.name || '-'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-950 text-right font-extrabold bg-slate-55/20">
                            {formatIDR(item.amount)}
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-right font-semibold">
                            {formatIDR(item.pocketMoney || 0)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setTariffFormEx({
                                    id: item.id,
                                    customerId: item.customerId || '',
                                    serviceType: item.serviceType || '',
                                    unit: item.unit || '',
                                    origin: item.origin || '',
                                    destination: item.destination || '',
                                    fleetType: item.fleetType || '',
                                    amount: item.amount || 0,
                                    pocketMoney: item.pocketMoney || 0,
                                    description: item.description || ''
                                  });
                                  setIsOpenTariffModal(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded border border-transparent hover:border-blue-100 transition"
                                title="Edit Tarif"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDelete('tariffs', item.id)}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                                title="Hapus Tarif"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Form Input Modal Pop-up Cepat */}
          <Modal
            isOpen={isOpenTariffModal}
            onClose={() => {
              setIsOpenTariffModal(false);
              setEditingId(null);
            }}
            title={editingId ? `Edit Tarif (${activeTariffTab === 'pengurusan' ? 'Jasa Pengurusan' : 'Trucking'})` : `Tambah Tarif ${activeTariffTab === 'pengurusan' ? 'Jasa Pengurusan' : 'Trucking'}`}
          >
            <form onSubmit={handleTariffSubmitEx} className="space-y-4" id="tariff-custom-form-modal">
              <div className="space-y-1 block">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Pelanggan / Customer *</label>
                <select
                  required
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={tariffFormEx.customerId}
                  onChange={(e) => setTariffFormEx(prev => ({ ...prev, customerId: e.target.value }))}
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.name})</option>
                  ))}
                </select>
              </div>

              {activeTariffTab === 'pengurusan' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Jenis Layanan *</label>
                      <select
                        required
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={tariffFormEx.serviceType}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, serviceType: e.target.value }))}
                      >
                        <option value="">-- Pilih Layanan --</option>
                        <option value="Customs Clearance (Impor)">Customs Clearance (Impor)</option>
                        <option value="Customs Clearance (Ekspor)">Customs Clearance (Ekspor)</option>
                        <option value="Jasa Undername (Impor)">Jasa Undername (Impor)</option>
                        <option value="Jasa Undername (Ekspor)">Jasa Undername (Ekspor)</option>
                        <option value="Jasa Penumpukan / Storage">Jasa Penumpukan / Storage</option>
                        <option value="Handling & Documentation">Handling & Documentation</option>
                        <option value="Jasa Karantina / Surveyor">Jasa Karantina / Surveyor</option>
                        <option value="Forwarding Services">Forwarding Services</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Satuan *</label>
                      <select
                        required
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={tariffFormEx.unit}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, unit: e.target.value }))}
                      >
                        <option value="">-- Pilih Satuan --</option>
                        <option value="Container 20ft">Container 20ft</option>
                        <option value="Container 40ft">Container 40ft</option>
                        <option value="Shipment">Shipment</option>
                        <option value="Doc / Dokumen">Doc / Dokumen</option>
                        <option value="CBM">CBM</option>
                        <option value="KG">KG</option>
                        <option value="Ton">Ton</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Tarif Jual Standar (IDR) *</label>
                    <input
                      required
                      type="number"
                      placeholder="Misal: 1500000"
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-mono"
                      value={tariffFormEx.amount || ''}
                      onChange={(e) => setTariffFormEx(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Kota Asal / Origin *</label>
                      <input
                        required
                        type="text"
                        placeholder="Misal: Tj. Priok, Jakarta"
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        value={tariffFormEx.origin}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, origin: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Kota Tujuan / Destination *</label>
                      <input
                        required
                        type="text"
                        placeholder="Misal: Cikarang Barat"
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        value={tariffFormEx.destination}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, destination: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tipe Armada *</label>
                      <select
                        required
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={tariffFormEx.fleetType}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, fleetType: e.target.value }))}
                      >
                        <option value="">-- Pilih Armada --</option>
                        <option value="Tronton">Truk Tronton</option>
                        <option value="Fuso">Truk Fuso</option>
                        <option value="Wingbox">Truk Wingbox</option>
                        <option value="CDE (Engkel)">Truk CDE (Engkel)</option>
                        <option value="CDD (Double)">Truk CDD (Double)</option>
                        <option value="Container 20ft">Trailer 20ft</option>
                        <option value="Container 40ft">Trailer 40ft</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Tarif Jual Standar (IDR) *</label>
                      <input
                        required
                        type="number"
                        placeholder="Misal: 3500000"
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-mono"
                        value={tariffFormEx.amount || ''}
                        onChange={(e) => setTariffFormEx(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Uang Jalan Supir Standar (IDR) *</label>
                    <input
                      required
                      type="number"
                      placeholder="Misal: 850000"
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-mono"
                      value={tariffFormEx.pocketMoney || ''}
                      onChange={(e) => setTariffFormEx(prev => ({ ...prev, pocketMoney: Number(e.target.value) }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Catatan Tambahan (Keterangan)</label>
                <textarea
                  rows={2}
                  placeholder="Informasi tambahan lain mengenai pricelist ini..."
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  value={tariffFormEx.description}
                  onChange={(e) => setTariffFormEx(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenTariffModal(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition"
                >
                  {loadingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Simpan Tarif</span>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      );
    }

    case 'armada-sopir': {
      if (activeSubTab === 'list') {
        return (
          <div className="space-y-8 animate-fade-in">
            {/* GRID 1: FLEET REGISTRY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Pendaftaran Inventaris Armada (Trucks)</h3>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="p-4">ID Unit</th>
                      <th className="p-4">Pelat Nomor STNK</th>
                      <th className="p-4">Merk / Model Unit</th>
                      <th className="p-4">Tipe Armada</th>
                      <th className="p-4">Status Jalan</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fleets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-slate-400 font-normal">
                          Belum ada unit truk yang didaftarkan.
                        </td>
                      </tr>
                    ) : (
                      fleets.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-mono text-blue-600">{item.id}</td>
                          <td className="p-4 text-slate-900 font-extrabold">{item.licensePlate}</td>
                          <td className="p-4">{item.model || '-'}</td>
                          <td className="p-4 text-slate-500 font-normal">{item.type || '-'}</td>
                          <td className="p-4 font-mono">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                              item.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'maintenance' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status?.toUpperCase() || 'READY'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDelete('fleets', item.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GRID 2: DRIVER ROSTER */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Roster Sopir Internal (Drivers)</h3>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="p-4">ID Driver</th>
                      <th className="p-4">Nama Lengkap</th>
                      <th className="p-4">No Telepon PIC</th>
                      <th className="p-4">No SIM BII / KIR</th>
                      <th className="p-4">Ketersediaan</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-slate-400 font-normal">
                          Belum ada personil sopir logistik yang didaftarkan.
                        </td>
                      </tr>
                    ) : (
                      drivers.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-mono text-indigo-600">{item.id}</td>
                          <td className="p-4 text-slate-900 font-bold">{item.name}</td>
                          <td className="p-4 font-mono text-slate-500">{item.phone || '-'}</td>
                          <td className="p-4 font-mono text-slate-600">{item.licenseNo || '-'}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                              item.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'on-duty' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                              {item.status?.toUpperCase() || 'AVAILABLE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDelete('drivers', item.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Form 1: Add Fleet */}
          <form onSubmit={handleFleetSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                <Truck className="w-4.5 h-4.5 text-blue-600" />
                <span>+ DAFTARKAN UNIT ARMADA</span>
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">ID Armada</label>
                  <input required type="text" placeholder="TRK-001" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold font-mono" value={fleetForm.id} onChange={(e) => setFleetForm(p => ({ ...p, id: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Pelat Nomor *</label>
                  <input required type="text" placeholder="B 9876 UI" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-extrabold font-mono" value={fleetForm.licensePlate} onChange={(e) => setFleetForm(p => ({ ...p, licensePlate: e.target.value.toUpperCase() }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Merk / Model</label>
                  <input type="text" placeholder="Hino Ranger 500" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" value={fleetForm.model} onChange={(e) => setFleetForm(p => ({ ...p, model: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Tipe Truk</label>
                  <input type="text" placeholder="Tronton Wingbox" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" value={fleetForm.type} onChange={(e) => setFleetForm(p => ({ ...p, type: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Status Truk</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" value={fleetForm.status} onChange={(e) => setFleetForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="ready">Ready (Siap Operasional)</option>
                  <option value="maintenance">Maintenance (Sedang Bengkel)</option>
                  <option value="on-trip">On Trip (Penugasan)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">Simpan Armada</button>
            </div>
          </form>

          {/* Form 2: Add Driver */}
          <form onSubmit={handleDriverSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                <UserIcon className="w-4.5 h-4.5 text-indigo-600" />
                <span>+ DAFTARKAN SOPIR BARU</span>
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">ID Sopir</label>
                  <input required type="text" placeholder="DVR-393" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono" value={driverForm.id} onChange={(e) => setDriverForm(p => ({ ...p, id: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Nama Sopir *</label>
                  <input required type="text" placeholder="Andi Prasetyo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" value={driverForm.name} onChange={(e) => setDriverForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Telepon PIC *</label>
                  <input required type="text" placeholder="0821-xxxx-xxxx" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono" value={driverForm.phone} onChange={(e) => setDriverForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Nomor SIM BII Umur</label>
                  <input type="text" placeholder="3809-1229-88" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono" value={driverForm.licenseNo} onChange={(e) => setDriverForm(p => ({ ...p, licenseNo: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Ketersediaan Roster</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" value={driverForm.status} onChange={(e) => setDriverForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="available">Available (Tersedia Roster)</option>
                  <option value="on-duty">On Duty (Sopir Berpasangan SPK)</option>
                  <option value="off">Off (Cuti / Istirahat Mandatori)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">Simpan Sopir</button>
            </div>
          </form>
        </div>
      );
    }

    case 'manajemen-job-order': {
      return <JobOrderView />;
    }

    case 'operasional-lapangan': {
      return <OperationalView />;
    }

    case 'manajemen-job-order-old': {
      const filtered = jobOrders.filter(j => {
        const q = searchQuery.toLowerCase();
        const customerObj = customers.find(c => c.id === j.customerId);
        const customerText = customerObj ? `${customerObj.companyName} ${customerObj.name}` : '';
        const matchQuery = !q ? true : (
          j.id?.toLowerCase().includes(q) ||
          j.origin?.toLowerCase().includes(q) ||
          j.destination?.toLowerCase().includes(q) ||
          customerText.toLowerCase().includes(q)
        );

        if (!matchQuery) return false;

        if (joActiveFilter === 'Semua') return true;
        const normStatus = (j.status || 'Draft').toLowerCase();
        if (joActiveFilter === 'Draft') return normStatus === 'draft';
        if (joActiveFilter === 'Berjalan') return normStatus === 'berjalan' || normStatus === 'in-progress' || normStatus === 'pending';
        if (joActiveFilter === 'Selesai') return normStatus === 'selesai' || normStatus === 'completed';
        if (joActiveFilter === 'Batal') return normStatus === 'batal' || normStatus === 'cancelled';
        return true;
      });

      const getServiceTypeLabel = (item: any) => {
        const hasInklaring = (item.billingInklaring || []).length > 0;
        const hasTrucking = (item.billingTrucking || []).length > 0;
        if (hasInklaring && hasTrucking) return "Inklaring + Trucking";
        if (hasInklaring) return "Jasa Pengurusan (Inklaring)";
        if (hasTrucking) return "Jasa Trucking";
        return "General Forwarding";
      };

      const calculateJOAmounts = (joItem: any) => {
        const bInklaringTotal = (joItem.billingInklaring || []).reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
        const cInklaringTotal = (joItem.costsInklaring || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        
        const bTruckingTotal = (joItem.billingTrucking || []).reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
        const cTruckingTotal = (joItem.costsTrucking || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

        const rTotal = (joItem.reimbursements || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

        const totalRevenue = bInklaringTotal + bTruckingTotal;
        const totalCost = cInklaringTotal + cTruckingTotal;
        const totalProfit = totalRevenue - totalCost;
        const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
          bInklaringTotal,
          cInklaringTotal,
          bTruckingTotal,
          cTruckingTotal,
          rTotal,
          totalRevenue,
          totalCost,
          totalProfit,
          profitMarginPercent
        };
      };

      if (activeSubTab === 'list') {
        return (
          <div className="space-y-6 animate-fade-in" id="manajemen-job-order-container">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs" id="jo-filter-pills">
              {['Semua', 'Draft', 'Berjalan', 'Selesai', 'Batal'].map((pill) => {
                const isActive = joActiveFilter === pill;
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setJoActiveFilter(pill as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>

            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="jo-control-bar">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setJoFullForm({
                    id: `JO-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    customerId: '',
                    clientPoRef: '',
                    origin: '',
                    destination: '',
                    fleetType: 'Tronton',
                    cargoDescription: '',
                    status: 'Draft',
                    billingInklaring: [
                      { id: '1', serviceName: 'Customs Clearance Impor', qty: 1, unitPrice: 2500000, total: 2500000 }
                    ],
                    costsInklaring: [
                      { id: '1', category: 'Sewa Genset / Reefer', providerName: 'PT Sarana Genset Mandiri', description: 'Monitoring 24 jam', amount: 750000 }
                    ],
                    billingTrucking: [
                      { id: '1', routeName: 'Tj. Priok ke Cikarang', qty: 1, unitPrice: 3500000, total: 3500000 }
                    ],
                    costsTrucking: [
                      { id: '1', costType: 'Internal', providerName: 'Supir Sulaeman', nopol: 'B 9283 UI', amount: 850000 }
                    ],
                    reimbursements: [
                      { id: '1', description: 'PNBP Bea Cukai', amount: 220000, receiptNumber: 'STR-7721' }
                    ]
                  });
                  setSubTab('input');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-all animate-pulse"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Job Order</span>
              </button>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari No. JO, Pelanggan, Rute..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List Tabel data */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="jo-tabel-section">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4 w-10"></th>
                    <th className="p-4">No. JO / Register</th>
                    <th className="p-4">Tanggal JO</th>
                    <th className="p-4">Klien / Pelanggan</th>
                    <th className="p-4">Tipe Layanan</th>
                    <th className="p-4">Rute (Origin ➔ Destination)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-12 text-slate-400 font-normal">
                        Belum ada daftar Job Order logistik yang sesuai dengan pencarian atau filter tab.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const associatedCustomer = customers.find(c => c.id === item.customerId);
                      const isExpanded = expandedJoId === item.id;
                      const amounts = calculateJOAmounts(item);
                      
                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            className={`hover:bg-slate-50/50 transition cursor-pointer select-none ${isExpanded ? 'bg-blue-50/10' : ''}`}
                            onClick={() => setExpandedJoId(isExpanded ? null : item.id)}
                          >
                            <td className="p-4 text-center">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </td>
                            <td className="p-4 font-mono font-bold text-blue-600">{item.id}</td>
                            <td className="p-4 font-semibold text-slate-600">{item.date || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '-')}</td>
                            <td className="p-4 font-semibold text-slate-900">
                              <div>
                                <div className="font-extrabold text-slate-900">{associatedCustomer?.companyName || 'Cash Customer / Umum'}</div>
                                <div className="text-[10px] text-slate-400 font-normal">PIC: {associatedCustomer?.name || '-'}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {getServiceTypeLabel(item)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{item.origin || '-'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{item.destination || '-'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                                (item.status || 'Draft').toLowerCase() === 'completed' || (item.status || 'Draft').toLowerCase() === 'selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                (item.status || 'Draft').toLowerCase() === 'in-progress' || (item.status || 'Draft').toLowerCase() === 'berjalan' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                (item.status || 'Draft').toLowerCase() === 'cancelled' || (item.status || 'Draft').toLowerCase() === 'batal' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}>
                                {item.status || 'Draft'}
                              </span>
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setJoFullForm({
                                      id: item.id,
                                      date: item.date || new Date().toISOString().split('T')[0],
                                      customerId: item.customerId || '',
                                      clientPoRef: item.clientPoRef || '',
                                      origin: item.origin || '',
                                      destination: item.destination || '',
                                      fleetType: item.fleetType || 'Tronton',
                                      cargoDescription: item.cargoDescription || '',
                                      status: item.status || 'Draft',
                                      billingInklaring: item.billingInklaring || [{ id: '1', serviceName: '', qty: 1, unitPrice: 0, total: 0 }],
                                      costsInklaring: item.costsInklaring || [{ id: '1', category: '', providerName: '', description: '', amount: 0 }],
                                      billingTrucking: item.billingTrucking || [{ id: '1', routeName: '', qty: 1, unitPrice: 0, total: 0 }],
                                      costsTrucking: item.costsTrucking || [{ id: '1', costType: 'Internal', providerName: '', nopol: '', amount: 0 }],
                                      reimbursements: item.reimbursements || [{ id: '1', description: '', amount: 0, receiptNumber: '' }]
                                    });
                                    setSubTab('input');
                                  }}
                                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded border border-transparent hover:border-blue-200 transition"
                                  title="Edit Job Order"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('jobOrders', item.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                                  title="Hapus Job Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable financial summary sheet */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-indigo-100" id={`expanded-row-${item.id}`}>
                              <td colSpan={8} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in text-xs">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Pendapatan (Tagihan Jual)</div>
                                      <div className="text-sm font-extrabold text-blue-700 mt-2">{formatIDR(amounts.totalRevenue)}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-semibold">
                                      Tagihan Inklaring: <span className="font-mono text-slate-900">{formatIDR(amounts.bInklaringTotal)}</span><br />
                                      Tagihan Trucking &emsp;: <span className="font-mono text-slate-900">{formatIDR(amounts.bTruckingTotal)}</span>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Biaya Operasional</div>
                                      <div className="text-sm font-extrabold text-red-600 mt-2">{formatIDR(amounts.totalCost)}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-semibold">
                                      Vendor Inklaring: <span className="font-mono text-slate-900">{formatIDR(amounts.cInklaringTotal)}</span><br />
                                      Uang Jalan Truck : <span className="font-mono text-slate-900">{formatIDR(amounts.cTruckingTotal)}</span>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Estimasi Profit Bersih</div>
                                      <div className={`text-sm font-extrabold mt-2 ${amounts.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {formatIDR(amounts.totalProfit)}
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed font-bold">
                                      Gross Profit Margin: <span className="text-emerald-700 text-xs font-extrabold">{amounts.profitMarginPercent.toFixed(1)}%</span>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Talangan Murni (Reimbursement)</div>
                                      <div className="text-sm font-extrabold text-amber-700 mt-2">{formatIDR(amounts.rTotal)}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(item.id);
                                        setJoFullForm({
                                          id: item.id,
                                          date: item.date || new Date().toISOString().split('T')[0],
                                          customerId: item.customerId || '',
                                          clientPoRef: item.clientPoRef || '',
                                          origin: item.origin || '',
                                          destination: item.destination || '',
                                          fleetType: item.fleetType || 'Tronton',
                                          cargoDescription: item.cargoDescription || '',
                                          status: item.status || 'Draft',
                                          billingInklaring: item.billingInklaring || [{ id: '1', serviceName: '', qty: 1, unitPrice: 0, total: 0 }],
                                          costsInklaring: item.costsInklaring || [{ id: '1', category: '', providerName: '', description: '', amount: 0 }],
                                          billingTrucking: item.billingTrucking || [{ id: '1', routeName: '', qty: 1, unitPrice: 0, total: 0 }],
                                          costsTrucking: item.costsTrucking || [{ id: '1', costType: 'Internal', providerName: '', nopol: '', amount: 0 }],
                                          reimbursements: item.reimbursements || [{ id: '1', description: '', amount: 0, receiptNumber: '' }]
                                        });
                                        setSubTab('input');
                                      }}
                                      className="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center space-x-1 shadow-xs transition-all"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Buka Cost-Revenue Sheet / Edit JO</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // FULLSCREEN FORM COMPONENT (Wajib Layar Penuh)
      // Calculating totals on type to render Profit Calculator box real-time
      const billingInklaringTotal = joFullForm.billingInklaring.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const costsInklaringTotal = joFullForm.costsInklaring.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      
      const billingTruckingTotal = joFullForm.billingTrucking.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const costsTruckingTotal = joFullForm.costsTrucking.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const reimbursementTotal = joFullForm.reimbursements.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const formTotalRevenue = billingInklaringTotal + billingTruckingTotal;
      const formTotalCost = costsInklaringTotal + costsTruckingTotal;
      const formTotalProfit = formTotalRevenue - formTotalCost;
      const formProfitMarginPercent = formTotalRevenue > 0 ? (formTotalProfit / formTotalRevenue) * 100 : 0;

      return (
        <form onSubmit={handleJobOrderSubmit} className="space-y-8 pb-32 animate-fade-in" id="jo-fullscreen-form">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-[10px] tracking-widest uppercase">
                <Briefcase className="w-4 h-4" />
                <span>Modul Cost & Revenue Sheet</span>
              </div>
              <h3 className="font-black text-slate-900 text-base md:text-lg mt-1">
                {editingId ? `Ubah Job Order ERP: ${editingId}` : "Formulir Registrasi Job Order ERP Baru"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Sistem pendataan operasional logistik plus cost monitoring untuk mencegah kerugian atau kebocoran biaya vendor.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSubTab('list');
                  setEditingId(null);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                Kembali ke Daftar
              </button>
              <button
                type="submit"
                disabled={loadingAction}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-extrabold flex items-center justify-center space-x-2 shadow-xs transition"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Simpan Job Order</span>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN LEFT: Header & Shipment */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-blue-600">Blok Header & Shipment</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Identifikasi umum Job Order logistik</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">No. Job Order Register *</label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        placeholder="TRF-001"
                        disabled={!!editingId}
                        className={`flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-bold font-mono text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`}
                        value={joFullForm.id}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, id: e.target.value.toUpperCase().replace(/\s+/g, '-') }))}
                      />
                      {!editingId && (
                        <button
                          type="button"
                          onClick={() => setJoFullForm(prev => ({ ...prev, id: `JO-${Math.floor(100000 + Math.random() * 900000)}` }))}
                          className="px-2.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition whitespace-nowrap"
                        >
                          Auto ID
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tanggal Register *</label>
                      <input
                        required
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-55 font-semibold"
                        value={joFullForm.date}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status Job Order</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-55 font-bold"
                        value={joFullForm.status}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Berjalan">Berjalan (In Progress)</option>
                        <option value="Selesai">Selesai (Completed)</option>
                        <option value="Batal">Batal (Cancelled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Partner Pelanggan / Customer *</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-55"
                      value={joFullForm.customerId}
                      onChange={(e) => setJoFullForm(prev => ({ ...prev, customerId: e.target.value }))}
                    >
                      <option value="">-- Hubungkan Pelanggan --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName} ({c.name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Ref No / Client PO</label>
                      <input
                        type="text"
                        placeholder="E.g. PO-8901"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        value={joFullForm.clientPoRef}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, clientPoRef: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tipe Armada</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-55"
                        value={joFullForm.fleetType}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, fleetType: e.target.value }))}
                      >
                        <option value="Tronton">Truk Tronton</option>
                        <option value="Fuso">Truk Fuso</option>
                        <option value="Wingbox">Truk Wingbox</option>
                        <option value="Trailer 20ft">Trailer 20ft</option>
                        <option value="Trailer 40ft">Trailer 40ft</option>
                        <option value="Double Engkel">Double Engkel (CDD)</option>
                        <option value="Engkel CDE">Engkel CDE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Kota Asal (Origin) *</label>
                      <input
                        required
                        type="text"
                        placeholder="Misal: Tj. Priok, JKT"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        value={joFullForm.origin}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, origin: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Kota Tujuan (Destination) *</label>
                      <input
                        required
                        type="text"
                        placeholder="Misal: Cikarang"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        value={joFullForm.destination}
                        onChange={(e) => setJoFullForm(prev => ({ ...prev, destination: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Deskripsi Barang CBM / Cargo</label>
                    <textarea
                      rows={2}
                      placeholder="Uraian isi muatan, berat manifest dll..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                      value={joFullForm.cargoDescription}
                      onChange={(e) => setJoFullForm(prev => ({ ...prev, cargoDescription: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: Blok Finansial 1, 2, 3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* BLOK FINANSIAL 1: Inklaring & Pengurusan (Forwarding) */}
              <div className="bg-white rounded-xl border border-purple-200 shadow-xs overflow-hidden">
                <div className="bg-purple-50 px-6 py-3 border-b border-purple-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-purple-900 text-xs uppercase tracking-wider">Blok Finansial 1: Inklaring & Pengurusan (Forwarding)</h4>
                    <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Semua pendapatan jasa pengurusan cargo dan tagihan vendor pendukung (depo, genset, custom clear)</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Table 1A - Billing/Jual */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[11px] font-extrabold text-slate-850 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-1.5 h-3 bg-emerald-500 rounded-sm"></span>
                        <span>1A. Tagihan Jual Jasa Ke Klien / Customer</span>
                      </h5>
                      <button
                        type="button"
                        onClick={addBillingInklaringRow}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded text-[10px] font-extrabold flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Item</span>
                      </button>
                    </div>

                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2">Nama Layanan Jasa Pelabuhan</th>
                          <th className="p-2 w-16 text-center">Qty</th>
                          <th className="p-2 w-32">Harga Satuan (IDR)</th>
                          <th className="p-2 w-32 text-right">Total Tagihan</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {joFullForm.billingInklaring.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2">
                              <input
                                required
                                type="text"
                                placeholder="E.g. Customs Clearance Fee Impor"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800"
                                value={item.serviceName}
                                onChange={(e) => updateBillingInklaringRow(item.id, 'serviceName', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                min="1"
                                className="w-full px-1.5 py-1.5 border border-slate-200 rounded text-center text-slate-800 font-mono"
                                value={item.qty}
                                onChange={(e) => updateBillingInklaringRow(item.id, 'qty', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                placeholder="Harga Satuan"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-800"
                                value={item.unitPrice || ''}
                                onChange={(e) => updateBillingInklaringRow(item.id, 'unitPrice', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-extrabold text-slate-900 bg-slate-50/40">
                              {formatIDR(item.total)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeBillingInklaringRow(item.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table 1B - Cost/Beli */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[11px] font-extrabold text-slate-850 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-1.5 h-3 bg-red-500 rounded-sm"></span>
                        <span>1B. Biaya Pengurusan (Beli / Bayar Vendor)</span>
                      </h5>
                      <button
                        type="button"
                        onClick={addCostsInklaringRow}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200 rounded text-[10px] font-extrabold flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Item</span>
                      </button>
                    </div>

                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2">Kategori Biaya</th>
                          <th className="p-2">Nama Vendor Pembayar</th>
                          <th className="p-2">Uraian / Keterangan</th>
                          <th className="p-2 w-32">Nominal (IDR)</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {joFullForm.costsInklaring.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2 w-1/4">
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 rounded font-semibold text-slate-800"
                                value={item.category}
                                onChange={(e) => updateCostsInklaringRow(item.id, 'category', e.target.value)}
                              >
                                <option value="">-- Pilih Kategori --</option>
                                <option value="Sewa Genset / Reefer">Sewa Genset / Reefer</option>
                                <option value="Depo Lift On/Of">Depo Lift On/Of</option>
                                <option value="Karantina / Surveyor">Karantina / Surveyor</option>
                                <option value="Storage / Overtime Pelabuhan">Storage / Overtime Pelabuhan</option>
                                <option value="Seal Kontainer & Admin Bea Cukai">Seal Kontainer & Admin Bea Cukai</option>
                                <option value="Port Handling">Port Handling</option>
                              </select>
                            </td>
                            <td className="p-2 w-1/4">
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-medium"
                                value={item.providerName}
                                onChange={(e) => updateCostsInklaringRow(item.id, 'providerName', e.target.value)}
                              >
                                <option value="">-- Pilih Vendor --</option>
                                {MOCK_VENDORS.map(v => (
                                  <option key={v.id} value={v.name}>{v.name}</option>
                                ))}
                                <option value="Lain-lain / Supir">Lain-lain / Cash</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Genset Reefer, Monitoring..."
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800"
                                value={item.description}
                                onChange={(e) => updateCostsInklaringRow(item.id, 'description', e.target.value)}
                              />
                            </td>
                            <td className="p-2 w-32">
                              <input
                                required
                                type="number"
                                placeholder="Misal: 750000"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-850"
                                value={item.amount || ''}
                                onChange={(e) => updateCostsInklaringRow(item.id, 'amount', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeCostsInklaringRow(item.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* BLOK FINANSIAL 2: TRUCKING */}
              <div className="bg-white rounded-xl border border-blue-200 shadow-xs overflow-hidden">
                <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">Blok Finansial 2: Jasa Trucking</h4>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Penghitungan ritase serta biaya jalan supir (Uang Jalan) / armada eksternal</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Table 2A - Billing/Jual */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[11px] font-extrabold text-slate-850 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-1.5 h-3 bg-emerald-500 rounded-sm"></span>
                        <span>2A. Ritase Jual / Invoice Trucking Ke Pelanggan</span>
                      </h5>
                      <button
                        type="button"
                        onClick={addBillingTruckingRow}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded text-[10px] font-extrabold flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Item</span>
                      </button>
                    </div>

                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2">Rute Layanan / Alokasi Ritase</th>
                          <th className="p-2 w-16 text-center">Qty</th>
                          <th className="p-2 w-32">Harga Satuan (IDR)</th>
                          <th className="p-2 w-32 text-right">Total Tagihan</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {joFullForm.billingTrucking.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2">
                              <input
                                required
                                type="text"
                                placeholder="E.g. Jasa Trucking Jakarta s/d Cikarang"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800"
                                value={item.routeName}
                                onChange={(e) => updateBillingTruckingRow(item.id, 'routeName', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                min="1"
                                className="w-full px-1.5 py-1.5 border border-slate-200 rounded text-center text-slate-800 font-mono"
                                value={item.qty}
                                onChange={(e) => updateBillingTruckingRow(item.id, 'qty', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                placeholder="Harga Satuan"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-800"
                                value={item.unitPrice || ''}
                                onChange={(e) => updateBillingTruckingRow(item.id, 'unitPrice', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-extrabold text-slate-900 bg-slate-50/40">
                              {formatIDR(item.total)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeBillingTruckingRow(item.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table 2B - Cost/Beli */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[11px] font-extrabold text-slate-850 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-1.5 h-3 bg-red-500 rounded-sm"></span>
                        <span>2B. Biaya Operasional / Uang Jalan Supir</span>
                      </h5>
                      <button
                        type="button"
                        onClick={addCostsTruckingRow}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200 rounded text-[10px] font-extrabold flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Item</span>
                      </button>
                    </div>

                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2 w-28">Skema Armada</th>
                          <th className="p-2">Vendor Truk / Nama Supir</th>
                          <th className="p-2 w-28">No. Polisi</th>
                          <th className="p-2 w-32">Uang Jalan (IDR)</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {joFullForm.costsTrucking.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2">
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 rounded font-semibold text-slate-800"
                                value={item.costType}
                                onChange={(e) => updateCostsTruckingRow(item.id, 'costType', e.target.value)}
                              >
                                <option value="Internal">Internal (Supir)</option>
                                <option value="Eksternal">Eksternal/Subcon</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="text"
                                placeholder={item.costType === 'Internal' ? "Nama Supir Logistik" : "Nama Vendor Sub-Kontraktor"}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold"
                                value={item.providerName}
                                onChange={(e) => updateCostsTruckingRow(item.id, 'providerName', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="B 1234 XY"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-mono"
                                value={item.nopol}
                                onChange={(e) => updateCostsTruckingRow(item.id, 'nopol', e.target.value.toUpperCase())}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                required
                                type="number"
                                placeholder="Uang Jalan"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-slate-805"
                                value={item.amount || ''}
                                onChange={(e) => updateCostsTruckingRow(item.id, 'amount', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeCostsTruckingRow(item.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* BLOK FINANSIAL 3: REIMBURSEMENT (Biaya Talangan Murni) */}
              <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
                <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">Blok Finansial 3: Biaya Talangan (Reimbursement)</h4>
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Biaya talangan murni di pelabuhan tanpa dikenakan margin keuntungan (Tagihan = Pengeluaran)</p>
                  </div>
                  <button
                    type="button"
                    onClick={addReimbursementRow}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200/80 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-2">Deskripsi Biaya Talangan (Pajak/THC/PNBP)</th>
                        <th className="p-2 w-36">Nominal Talangan (IDR)</th>
                        <th className="p-2 w-48">Keterangan / No. Struk / Nota</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {joFullForm.reimbursements.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <input
                              required
                              type="text"
                              placeholder="E.g. Pembayaran PNBP Bea Cukai, THC Pelabuhan"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800"
                              value={item.description}
                              onChange={(e) => updateReimbursementRow(item.id, 'description', e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              type="number"
                              placeholder="Faktur Nominal"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-slate-800"
                              value={item.amount || ''}
                              onChange={(e) => updateReimbursementRow(item.id, 'amount', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Resi / No Bukti Bayar"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold"
                              value={item.receiptNumber}
                              onChange={(e) => updateReimbursementRow(item.id, 'receiptNumber', e.target.value)}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeReimbursementRow(item.id)}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL KALKULATOR PROFIT (REAL-TIME FLOATING BOX) */}
          <div 
            className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl p-5 w-76 animate-fade-in transition-all"
            id="jo-profit-cal-box"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>REALTIME PROFIT CHECK</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black text-slate-900 uppercase font-mono ${formTotalProfit >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}>
                {formTotalProfit >= 0 ? 'Surplus' : 'Defisit'}
              </span>
            </div>

            <div className="space-y-2 text-slate-300 font-semibold text-[11px]">
              <div className="flex justify-between items-center">
                <span>Total Jual (Revenue):</span>
                <span className="font-mono text-white text-xs">{formatIDR(formTotalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Beli (Operasional):</span>
                <span className="font-mono text-slate-400 text-xs">{formatIDR(formTotalCost)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Total Talangan (Reimburse):</span>
                <span className="font-mono text-amber-400 text-xs">{formatIDR(reimbursementTotal)}</span>
              </div>

              <div className="pt-2 px-1 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white text-xs">Profit Bersih:</span>
                <span className={`font-mono text-sm font-extrabold ${formTotalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatIDR(formTotalProfit)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mt-1">
                <span>Margin Profit Persentase:</span>
                <span className={formTotalProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                  {formProfitMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <p className="text-[9px] text-slate-500 font-normal italic mt-3 text-center border-t border-slate-800/60 pt-2">
              * Reimbursement talangan tidak dihitung ke margin profit operasional
            </p>
          </div>
        </form>
      );
    }

    case 'surat-perintah-kerja': {
      const filtered = spks.filter(s => {
        return s.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               s.status?.toLowerCase().includes(searchQuery.toLowerCase());
      });

      if (activeSubTab === 'list') {
        return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari ID SPK..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4">No. SPK Trip</th>
                    <th className="p-4">Rute Ref JO</th>
                    <th className="p-4">Nama Sopir Assigned</th>
                    <th className="p-4">Nomor Pelat Armada</th>
                    <th className="p-4">Uang Jalan (IDR)</th>
                    <th className="p-4">Voucher BBM Sol</th>
                    <th className="p-4 font-normal">Status Trip</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400 font-normal">
                        Belum ada Surat Perintah Kerja (SPK) yang terbit di sistem.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const associatedJo = jobOrders.find(j => j.id === item.jobOrderId);
                      const associatedDriver = drivers.find(d => d.id === item.driverId);
                      const associatedFleet = fleets.find(f => f.id === item.fleetId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-mono text-emerald-600">{item.id}</td>
                          <td className="p-4 font-mono text-slate-600">
                            <strong>{item.jobOrderId}</strong>
                            {associatedJo && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {associatedJo.origin} &middot; {associatedJo.destination}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-900">{associatedDriver?.name || 'SOPIR UNKNOWN'}</td>
                          <td className="p-4 font-extrabold font-mono text-slate-800">{associatedFleet?.licensePlate || '-'}</td>
                          <td className="p-4 font-mono">{formatIDR(item.pocketMoney)}</td>
                          <td className="p-4 font-mono text-slate-500">{formatIDR(item.fuelAllowance)}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'on-the-road' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status?.toUpperCase() || 'ASSIGNED'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDelete('spks', item.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      return (
        <form onSubmit={handleSpkSubmit} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Penerbitan Surat Perintah Kerja (SPK logistik)</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-normal">Pilih Job Order referensi, pasangkan armada truk kosong, saku sopir, dan bensin ritase.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">No. SPK Trip Seri *</label>
              <input required type="text" placeholder="SPK-20261" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-bold font-mono" value={spkForm.id} onChange={(e) => setSpkForm(p => ({ ...p, id: e.target.value.toUpperCase().replace(/\s+/g, '-') }))} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pilih Referensi Job Order *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800" value={spkForm.jobOrderId} onChange={(e) => setSpkForm(p => ({ ...p, jobOrderId: e.target.value }))}>
                <option value="">-- Pilih Job Order --</option>
                {jobOrders.map(j => (
                  <option key={j.id} value={j.id}>{j.id} - ({j.origin} ke {j.destination})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tugaskan Sopir Roster *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800" value={spkForm.driverId} onChange={(e) => setSpkForm(p => ({ ...p, driverId: e.target.value }))}>
                <option value="">-- Pilih Sopir Tersedia --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tugaskan Unit Armada Truk *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800" value={spkForm.fleetId} onChange={(e) => setSpkForm(p => ({ ...p, fleetId: e.target.value }))}>
                <option value="">-- Pilih Truk Unit --</option>
                {fleets.map(f => (
                  <option key={f.id} value={f.id}>{f.licensePlate} ({f.model || f.type}) - {f.status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-bold">Alokasi Uang Saku Sopir (IDR) *</label>
              <input required type="number" placeholder="500000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono" value={spkForm.pocketMoney || ''} onChange={(e) => setSpkForm(p => ({ ...p, pocketMoney: Number(e.target.value) }))} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-slate-500 font-bold">Voucher Solar BBM Ritase (IDR) *</label>
              <input required type="number" placeholder="1200000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono" value={spkForm.fuelAllowance || ''} onChange={(e) => setSpkForm(p => ({ ...p, fuelAllowance: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status Dispatch Pertama</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold" value={spkForm.status} onChange={(e) => setSpkForm(p => ({ ...p, status: e.target.value }))}>
              <option value="assigned">Assigned (Menugaskan Mandatori)</option>
              <option value="on-the-road">On The Road (Dalam Perjalanan Ritase)</option>
              <option value="delivered">Delivered (Truk Sudah Bongkar / Landing)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button type="button" onClick={() => setSubTab('list')} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold">Cancel</button>
            <button type="submit" disabled={loadingAction} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-2">
              {loadingAction ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Terbitkan SPK Trip</span>}
            </button>
          </div>
        </form>
      );
    }

    case 'tagihan-pajak': {
      const filtered = invoices.filter(inv => {
        return inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               inv.status?.toLowerCase().includes(searchQuery.toLowerCase());
      });

      if (activeSubTab === 'list') {
        return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari ID Faktur Invoice..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="p-4">Faktur Invoice No</th>
                    <th className="p-4">Ref JO No</th>
                    <th className="p-4">Nilai Dasar (DPP)</th>
                    <th className="p-4">PPN Alokasi</th>
                    <th className="p-4">Jumlah PPN</th>
                    <th className="p-4">Jumlah Tagihan (Bruto)</th>
                    <th className="p-4">Status Bayar</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400 font-normal">
                        Belum ada invoice / faktur pajak yang terdaftar di database.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono text-amber-600 font-extrabold">{item.id}</td>
                        <td className="p-4 font-mono text-slate-600">{item.jobOrderId}</td>
                        <td className="p-4 font-mono">{formatIDR(item.amount)}</td>
                        <td className="p-4 font-mono text-slate-500">{item.taxRate}%</td>
                        <td className="p-4 font-mono text-slate-500">{formatIDR(item.taxAmount || 0)}</td>
                        <td className="p-4 font-mono text-slate-900 bg-slate-50/40">{formatIDR(item.totalAmount || 0)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                            item.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {item.status?.toUpperCase() || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDelete('invoices', item.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      return (
        <form onSubmit={handleInvoiceSubmit} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Pembuatan Invoice & Rekapitulasi Pajak PPN *</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-normal font-sans">Kalkulasi nilai dasar, hitung PPN otomatis, dan catat ke akun piutang usaha logistik.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">No Seri Faktur Invoice *</label>
              <input required type="text" placeholder="INV-20261" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-bold font-mono" value={invoiceForm.id} onChange={(e) => setInvoiceForm(p => ({ ...p, id: e.target.value.toUpperCase().replace(/\s+/g, '-') }))} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Job Order Referensi *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800" value={invoiceForm.jobOrderId} onChange={(e) => {
                const jId = e.target.value;
                const matchJo = jobOrders.find(j => j.id === jId);
                const matchTrf = matchJo ? tariffs.find(t => t.id === matchJo.tariffId) : null;
                setInvoiceForm(p => ({ 
                  ...p, 
                  jobOrderId: jId,
                  amount: matchTrf ? matchTrf.amount : 0
                }));
              }}>
                <option value="">-- Pilih Job Order --</option>
                {jobOrders.map(j => (
                  <option key={j.id} value={j.id}>{j.id} - ({j.origin} ke {j.destination})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nilai Dasar DPP Pengiriman (IDR)</label>
              <input type="number" placeholder="Harga jasa dasar" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono font-semibold" value={invoiceForm.amount || ''} onChange={(e) => setInvoiceForm(p => ({ ...p, amount: Number(e.target.value) }))} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pajak Tambahan PPN %</label>
              <input required type="number" placeholder="11" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono" value={invoiceForm.taxRate} onChange={(e) => setInvoiceForm(p => ({ ...p, taxRate: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status Bayar Bank</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold" value={invoiceForm.status} onChange={(e) => setInvoiceForm(p => ({ ...p, status: e.target.value }))}>
              <option value="unpaid">Unpaid (Faktur Terbuka - Piutang)</option>
              <option value="paid">Paid (Telah Lunas Rekening Koran)</option>
            </select>
          </div>

          {invoiceForm.amount > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-1.5 text-xs font-semibold font-mono text-slate-700 animate-slide-up shadow-inner">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 font-sans text-[11px] text-slate-400">
                <span>Rincian Penghitungan Pajak Serta Suku:</span>
                <span>IDR / Rupiah</span>
              </div>
              <div className="flex justify-between">
                <span>Harga Dasar Jasa (DPP) :</span>
                <span>{formatIDR(invoiceForm.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] font-normal">
                <span>Jumlah PPN {invoiceForm.taxRate}% :</span>
                <span>+ {formatIDR((invoiceForm.amount * invoiceForm.taxRate) / 100)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-1.5 border-t border-slate-200">
                <span>Jumlah Bruto Tagihan :</span>
                <span className="text-amber-700">{formatIDR(invoiceForm.amount + (invoiceForm.amount * invoiceForm.taxRate) / 100)}</span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button type="button" onClick={() => setSubTab('list')} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold">Cancel</button>
            <button type="submit" disabled={loadingAction} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-md">
              {loadingAction ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Terbitkan Invoice Fak</span>}
            </button>
          </div>
        </form>
      );
    }

    default:
      return <div className="text-center p-8 text-xs text-slate-400">Modul tidak dikenali.</div>;
  }
}
