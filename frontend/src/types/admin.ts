export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface PageData<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
