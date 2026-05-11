-- AlterTable
ALTER TABLE `role_permissions` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank') NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank') NOT NULL;
