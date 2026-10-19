import React from 'react';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { compactVnd } from '../../utils/formatters';

interface ReportKpiCardsProps {
  totalCustomers: number;
  totalPipelineValue: number;
  totalCompanies: number;
  conversionRate: number;
  quotedValue?: number;
  quotedCount?: number;
  inProgressCount?: number;
  stoppedCount?: number;
}

/* ==========================================================================
   BỐN CHỈ SỐ CHÍNH
   --------------------------------------------------------------------------
   Bản trước có chip xanh/đỏ kiểu "↗ +100% dữ liệu thực tế", "↘ 967%" — trông
   như biến động so với kỳ trước nhưng máy chủ không trả số liệu kỳ trước, và
   khi API chưa trả trường nào thì thẻ hiện số mặc định cứng (789 triệu, 25, 29).
   Giờ mỗi thẻ chỉ có con số chính và một dòng giải thích từ dữ liệu thật.
   ========================================================================== */

export const ReportKpiCards: React.FC<ReportKpiCardsProps> = ({
  totalCustomers,
  totalPipelineValue,
  totalCompanies,
  conversionRate,
  quotedValue = 0,
  quotedCount = 0,
  inProgressCount = 0,
  stoppedCount = 0,
}) => {
  const pipeline = compactVnd(totalPipelineValue);
  const quoted = compactVnd(quotedValue);
  const stoppedShare = totalCustomers > 0 ? Math.round((stoppedCount / totalCustomers) * 100) : 0;

  const cards = [
    {
      title: 'Tổng giá trị tiềm năng',
      ...pipeline,
      note: (
        <>
          <b>{totalCustomers.toLocaleString('vi-VN')}</b> khách hàng · tỷ lệ chốt <b>{conversionRate}%</b>
        </>
      ),
    },
    {
      title: 'Đã gửi báo giá',
      ...quoted,
      note: (
        <>
          <b>{quotedCount}</b> khách đang chờ phản hồi báo giá
        </>
      ),
    },
    {
      title: 'Doanh nghiệp liên kết',
      num: totalCompanies,
      unit: 'công ty',
      decimals: 0,
      note: (
        <>
          <b>{inProgressCount}</b> khách đang tư vấn hoặc demo
        </>
      ),
    },
    {
      title: 'Đã dừng / Huỷ',
      num: stoppedCount,
      unit: 'khách',
      decimals: 0,
      note: (
        <>
          Chiếm <b>{stoppedShare}%</b> tổng số khách hàng
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
      {cards.map((card, idx) => (
        <div key={card.title} className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card">
          <span className="text-sm text-fg-subtle">{card.title}</span>

          <div className="mt-2 flex items-baseline gap-1.5 text-kpi font-semibold text-fg">
            <span className="tnum">
              <AnimatedCounter value={card.num} decimals={card.decimals} duration={800 + idx * 100} />
            </span>
            <span className="text-md font-medium tracking-normal text-fg-subtle">{card.unit}</span>
          </div>

          <p className="tnum mt-4 border-t border-divider pt-3 text-xs text-fg-subtle [&_b]:font-semibold [&_b]:text-fg-body">
            {card.note}
          </p>
        </div>
      ))}
    </div>
  );
};
