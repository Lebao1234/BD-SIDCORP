import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { 
      name, tax_code, email, phone, address, website, field, note, status,
      facebook, linkedin, zalo, location, bank_name, bank_account_no, bank_branch
    } = req.body;
    
    // Validate
    if (!name) {
      return res.status(400).json({ message: 'Tên công ty là bắt buộc' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        tax_code: tax_code || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        field: field || null,
        note: note || null,
        status: status || undefined,
        facebook: facebook || null,
        linkedin: linkedin || null,
        zalo: zalo || null,
        location: location || null,
        bank_name: bank_name || null,
        bank_account_no: bank_account_no || null,
        bank_branch: bank_branch || null,
      }
    });

    res.status(201).json(company);
  } catch (error: any) {
    console.error('Lỗi khi tạo công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, tax_code, email, phone, address, website, field, note, status,
      facebook, linkedin, zalo, location, bank_name, bank_account_no, bank_branch
    } = req.body;

    const company = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        name,
        tax_code: tax_code || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        field: field || null,
        note: note || null,
        status,
        facebook: facebook || null,
        linkedin: linkedin || null,
        zalo: zalo || null,
        location: location || null,
        bank_name: bank_name || null,
        bank_account_no: bank_account_no || null,
        bank_branch: bank_branch || null,
      }
    });

    res.json(company);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

export const getCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id: Number(id) }
    });

    if (!company) {
      return res.status(404).json({ message: 'Không tìm thấy công ty' });
    }

    res.json(company);
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

export const listCompanies = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    let companies;

    if (userRole === 'admin') {
      companies = await prisma.company.findMany({
        orderBy: { created_at: 'desc' }
      });
    } else {
      // User chỉ được thấy các công ty có liên kết với khách hàng mà họ quản lý
      // hoặc các công ty không có user quản lý nào (nếu cần? - Tạm thời chỉ filter theo khách hàng họ sở hữu)
      companies = await prisma.company.findMany({
        where: {
          customers: {
            some: {
              owner_id: userId
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    }
    
    res.json(companies);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};
