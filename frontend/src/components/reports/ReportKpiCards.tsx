import React from 'react';
import { Users, Wallet, Building2, Target } from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface ReportKpiCardsProps {
  totalCustomers: number;
  totalPipelineValue: number;
  totalCompanies: number;
  conversionRate: number;
  isAdmin?: boolean;
}

/* ==========================================================================
   THẺ KPI - CÓ HIỆU ỨNG CHẠY SỐ MƯỢT MÀ KHI VÀO TRANG
   --------------------------------------------------------------------------
   Bố cục theo mẫu tham chiếu: nhãn ở trên cùng bên trái, icon mờ ở góc phải,
   con số lớn ở giữa (chạy từ 0 lên số liệu thật bằng AnimatedCounter),
   dòng giải thích ở dưới.
   ========================================================================== */

export const ReportKpiCards: React.FC<ReportKpiCardsProps> = ({
  totalCustomers,
  totalPipelineValue,
  totalCompanies,
  conversionRate,
  isAdmin = false,
}) => {
  // Chuẩn hóa số liệu và đơn vị doanh số tiềm năng
  const getPipelineNumberAndUnit = (val: number): { num: number; decimals: number; unit: string } => {
    if (val >= 1_000_000_000) {
      return { num: val / 1_000_000_000, decimals: 2, unit: 'tỷ ₫' };
    }
    if (val >= 1_000_000) {
      return { num: Math.round(val / 1_000_000), decimals: 0, unit: 'triệu ₫' };
    }
    return { num: val, decimals: 0, unit: '₫' };
  };

  const pipeline = getPipelineNumberAndUnit(totalPipelineValue);

  const cards = [
    {
      label: isAdmin ? 'Khách hàng toàn hệ thống' : 'Khách hàng đang quản lý',
      targetNumber: totalCustomers,
      decimals: 0,
      unit: '',
      note: isAdmin ? 'Toàn bộ dữ liệu công ty' : 'Đang được gán cho bạn',
      icon: Users,
    },
    {
      label: 'Doanh số tiềm năng',
      targetNumber: pipeline.num,
      decimals: pipeline.decimals,
      unit: pipeline.unit,
      note: 'Tổng giá trị thương vụ đang mở',
      icon: Wallet,
    },
    {
      label: 'Doanh nghiệp B2B',
      targetNumber: totalCompanies,
      decimals: 0,
      unit: '',
      note: 'Hồ sơ đối tác đã lưu',
      icon: Building2,
    },
    {
      label: 'Tỷ lệ chốt hợp đồng',
      targetNumber: conversionRate,
      decimals: 1,
      unit: '%',
      note: 'Khách đã ký hoặc đã gửi hợp đồng',
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            style={{ animationDelay: `${index * 80}ms` }}
            className="group flex flex-col gap-2 rounded-card border border-line bg-surface p-4
              dark:border-[#332f2c] dark:bg-[#232120] animate-fade-in-up transition-all duration-300 ease-out
              hover:-translate-y-1 hover:shadow-md hover:border-line-strong dark:hover:border-[#47423d] cursor-default"
          >
            <div className="flex items-start gap-2">
              <span className="text-xs text-fg-subtle dark:text-[#8f8b84] transition-colors group-hover:text-fg dark:group-hover:text-white">
                {card.label}
              </span>
              <Icon
                className="ml-auto h-4 w-4 shrink-0 text-fg-empty dark:text-[#5c574f] transition-all duration-300
                  group-hover:text-fg dark:group-hover:text-white group-hover:scale-110"
                strokeWidth={1.7}
              />
            </div>

            <div className="tnum text-[26px] font-semibold leading-none tracking-[-0.02em] text-fg dark:text-[#f2f0ed] flex items-baseline">
              <AnimatedCounter
                value={card.targetNumber}
                decimals={card.decimals}
                duration={900 + index * 100}
              />
              {card.unit && (
                <span className="ml-1 text-[15px] font-medium text-fg-subtle dark:text-[#8f8b84]">
                  {card.unit}
                </span>
              )}
            </div>

            <div className="text-xs text-fg-faint dark:text-[#7f7b74]">{card.note}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportKpiCards;
