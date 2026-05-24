import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name, tax_code, email, phone, address, website, field, note } = req.body;
    
    // Validate
    if (!name) {
      return res.status(400).json({ message: 'Tên công ty là bắt buộc' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        tax_code,
        email,
        phone,
        address,
        website,
        field,
        note
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
    const { name, tax_code, email, phone, address, website, field, note, status } = req.body;

    const company = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        name,
        tax_code,
        email,
        phone,
        address,
        website,
        field,
        note,
        status
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
    const companies = await prisma.company.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(companies);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};
