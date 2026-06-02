import React, { useState } from 'react';
import { Building2, Search, Plus } from 'lucide-react';
import { DataTable, Column } from '../../../components/Table/DataTable';
import { Company } from '../../../types';
import { useCompanies } from '../../../hooks/useCompanies';
import { formatDate } from '../../../utils/formatters';
import { COMPANY_STATUS_CLASS, COMPANY_STATUS_LABEL } from '../../../utils/constants';

interface CompanyTabProps {
  onOpenCompanyForm: (companyId: number | null) => void;
}

export const CompanyTab: React.FC<CompanyTabProps> = ({ onOpenCompanyForm }) => {
  const { companies, loadingCompanies } = useCompanies(true); // autoFetch = true
  const [searchQuery, setSearchQuery] = useState('');

  const companyColumns: Column<Company>[] = [
    {
      key: 'id',
      title: 'ID',
      render: (comp) => <span className="text-slate-400 text-xs font-bold">#{comp.id}</span>,
    },
    {
      key: 'name',
      title: 'Tên đầu mối',
      render: (comp) => (
        <span
          className="font-bold text-white hover:underline cursor-pointer"
          onClick={() => onOpenCompanyForm(comp.id)}
        >
          {comp.name}
        </span>
      ),
    },
    {
      key: 'tax_code',
      title: 'Mã số thuế',
      render: (comp) => <span className="text-xs text-slate-300">{comp.tax_code || '-'}</span>,
    },
    {
      key: 'field',
      title: 'Lĩnh vực',
      render: (comp) => <span className="text-xs text-slate-300">{comp.field || '-'}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (comp) => (
        <span
          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            COMPANY_STATUS_CLASS[comp.status] ?? 'bg-slate-500/20 text-slate-300'
          }`}
        >
          {COMPANY_STATUS_LABEL[comp.status] ?? comp.status}
        </span>
      ),
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      render: (comp) => <span className="text-xs text-slate-300">{comp.phone || '-'}</span>,
    },
    {
      key: 'email',
      title: 'Email',
      render: (comp) => <span className="text-xs text-slate-300">{comp.email || '-'}</span>,
    },
    {
      key: 'website',
      title: 'Website',
      render: (comp) => <span className="text-xs text-slate-300">{comp.website || '-'}</span>,
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      render: (comp) => <span className="text-xs text-slate-300 truncate max-w-[120px] inline-block" title={comp.address}>{comp.address || '-'}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (comp) => <span className="text-slate-400 text-[10px]">{formatDate(comp.created_at)}</span>,
    },
  ];

  const filteredCompanies = companies.filter(comp =>
    (comp.name && comp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (comp.tax_code && comp.tax_code.includes(searchQuery))
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#e8732c]" />
          Danh sách Đầu mối Doanh nghiệp
        </h2>

        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm đầu mối doanh nghiệp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#e8732c] transition"
            />
          </div>
          <button
            onClick={() => onOpenCompanyForm(null)}
            className="bg-[#e8732c] hover:bg-[#f5882e] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-[#e8732c]/10"
          >
            <Plus className="w-4 h-4" />
            Thêm Đầu Mối Doanh Nghiệp
          </button>
        </div>
      </div>

      <DataTable
        columns={companyColumns}
        data={filteredCompanies}
        keyExtractor={(comp) => comp.id.toString()}
        isLoading={loadingCompanies}
        emptyMessage="Không có đầu mối doanh nghiệp nào."
      />
    </>
  );
};
