-- =====================================================
-- Seed Transaction Categories for Cash Transaction Integration
-- =====================================================
-- This file contains the seed data for transaction categories
-- used in the IPL & Kegiatan integration with cash transactions.
--
-- Run this file to populate the transaction_categories table
-- with the initial categories needed for the system.
--
-- Usage:
--   psql -U your_username -d your_database -f seed-transaction-categories.sql
-- =====================================================

-- Clear existing categories (optional - uncomment if needed)
-- DELETE FROM transaction_categories WHERE category_code LIKE 'IPL-%' OR category_code LIKE 'KEGIATAN-%';

-- =====================================================
-- IPL Income Categories
-- =====================================================
INSERT INTO transaction_categories (id, category_code, category_name, description, category_type, is_active, created_at, updated_at) VALUES
('cat-ipl-income-001', 'IPL-MASUK', 'Pemasukan IPL', 'Pemasukan dari pembayaran IPL bulanan warga', 'INCOME', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Kegiatan Income Categories
-- =====================================================
INSERT INTO transaction_categories (id, category_code, category_name, description, category_type, is_active, created_at, updated_at) VALUES
('cat-keg-income-001', 'KEGIATAN-MASUK', 'Iuran Kegiatan Warga', 'Pemasukan dari iuran kegiatan sosial warga', 'INCOME', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-income-002', 'SUMBANGAN-KAS', 'Sumbangan Kas', 'Pemasukan dari sumbangan kas komunitas', 'INCOME', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- IPL Expense Categories
-- =====================================================
INSERT INTO transaction_categories (id, category_code, category_name, description, category_type, is_active, created_at, updated_at) VALUES
('cat-ipl-exp-001', 'IPL-KEBERSIHAN', 'Kebersihan Lingkungan', 'Pengeluaran untuk kebersihan lingkungan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-ipl-exp-002', 'IPL-KEAMANAN', 'Keamanan', 'Pengeluaran untuk keamanan/ Satpam', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-ipl-exp-003', 'IPL-FASILITAS', 'Perbaikan Fasilitas', 'Pengeluaran untuk perbaikan fasilitas umum', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-ipl-exp-004', 'IPL-ADMIN', 'Admin IPL', 'Biaya administrasi IPL', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-ipl-exp-005', 'IPL-LISTRIK', 'Listrik Area Umum', 'Pengeluaran listrik untuk area umum', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-ipl-exp-006', 'IPL-AIR', 'Air Area Umum', 'Pengeluaran air untuk area umum', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Kegiatan Expense Categories
-- =====================================================
INSERT INTO transaction_categories (id, category_code, category_name, description, category_type, is_active, created_at, updated_at) VALUES
('cat-keg-exp-001', 'KEGIATAN-MAKANAN', 'Konsumsi Makanan', 'Pengeluaran konsumsi makanan untuk kegiatan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-exp-002', 'KEGIATAN-DEKORASI', 'Dekorasi & Perlengkapan', 'Pengeluaran dekorasi dan perlengkapan kegiatan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-exp-003', 'KEGIATAN-HIBURAN', 'Hiburan', 'Pengeluaran hiburan untuk kegiatan warga', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-exp-004', 'KEGIATAN-TRANSPORT', 'Transportasi', 'Pengeluaran transportasi terkait kegiatan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-exp-005', 'KEGIATAN-HADIAH', 'Hadiah & Doorprize', 'Pengeluaran untuk hadiah dan doorprize', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-keg-exp-006', 'KEGIATAN-LAINNYA', 'Kegiatan Lainnya', 'Pengeluaran lainnya terkait kegiatan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Other Common Categories
-- =====================================================
INSERT INTO transaction_categories (id, category_code, category_name, description, category_type, is_active, created_at, updated_at) VALUES
('cat-misc-001', 'PEMASUKAN-LAIN', 'Pemasukan Lainnya', 'Pemasukan lainnya yang belum terkategori', 'INCOME', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-misc-002', 'PENGELUARAN-LAIN', 'Pengeluaran Lainnya', 'Pengeluaran lainnya yang belum terkategori', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-misc-003', 'OPERASIONAL', 'Biaya Operasional', 'Biaya operasional umum', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-misc-004', 'GAJI-KARYAWAN', 'Gaji Karyawan', 'Penggajian karyawan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-misc-005', 'UANG-MUKA', 'Uang Muka Karyawan', 'Pembayaran uang muka kepada karyawan', 'EXPENSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the categories were inserted successfully
--
-- SELECT category_type, COUNT(*) as count
-- FROM transaction_categories
-- WHERE category_code LIKE 'IPL-%' OR category_code LIKE 'KEGIATAN-%' OR category_code LIKE 'PEMASUKAN-%' OR category_code LIKE 'PENGELUARAN-%'
-- GROUP BY category_type;
--
-- SELECT * FROM transaction_categories ORDER BY category_type, category_code;
