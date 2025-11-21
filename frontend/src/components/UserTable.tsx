import React from "react";
import { Button, Space, Table } from "antd";

export interface UserDto {
  _id: string;
  telegramId?: number;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  users: UserDto[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, onDelete }) => {
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (value: string | undefined) => (value ? `@${value}` : "-")
    },
    {
      title: "Telegram ID",
      dataIndex: "telegramId",
      key: "telegramId",
      render: (value: number | undefined) => value || "-"
    },
    {
      title: "Створено",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: "actions",
      render: (_: unknown, record: UserDto) => (
        <Space>
          <Button danger size="small" onClick={() => onDelete(record._id)}>
            Видалити
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Table<UserDto>
      rowKey="_id"
      columns={columns}
      dataSource={users}
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};
