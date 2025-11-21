import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Typography, Form, Input, Button, message, Divider } from "antd";
import { AppLayout } from "./layout/AppLayout";
import { createApiClient } from "./api/client";
import { UserForm } from "./components/UserForm";
import { UserDto, UserTable } from "./components/UserTable";

const { Title, Text } = Typography;

const App: React.FC = () => {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const api = useMemo(() => createApiClient(adminKey), [adminKey]);

  const loadUsers = useCallback(async () => {
    if (!adminKey) {
      return;
    }
    try {
      setLoadingUsers(true);
      const res = await api.get<UserDto[]>("/api/users");
      setUsers(res.data);
    } catch {
      message.error("Не вдалося завантажити користувачів");
    } finally {
      setLoadingUsers(false);
    }
  }, [api, adminKey]);

  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      setAdminKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (adminKey) {
      loadUsers();
    }
  }, [adminKey, loadUsers]);

  const handleSaveKey = async (values: { adminKey: string }) => {
    setSavingKey(true);
    try {
      const key = values.adminKey.trim();
      if (!key) {
        message.error("Введіть ключ");
        return;
      }
      const testClient = createApiClient(key);
      await testClient.get("/api/users");
      localStorage.setItem("adminKey", key);
      setAdminKey(key);
      message.success("Ключ збережено");
    } catch {
      message.error("Невірний ключ або помилка доступу");
    } finally {
      setSavingKey(false);
    }
  };

  const handleAddUser = async (values: { username?: string; telegramId?: string }) => {
    if (!adminKey) {
      return;
    }
    const username = values.username?.trim();
    const telegramIdStr = values.telegramId?.trim();

    if (!username && !telegramIdStr) {
      message.error("Заповніть username або telegramId");
      return;
    }

    let telegramId: number | undefined;
    if (telegramIdStr) {
      const parsed = Number(telegramIdStr);
      if (Number.isNaN(parsed)) {
        message.error("telegramId має бути числом");
        return;
      }
      telegramId = parsed;
    }

    try {
      setAddingUser(true);
      await api.post("/api/users", { username, telegramId });
      message.success("Користувача додано");
      await loadUsers();
    } catch {
      message.error("Помилка при додаванні користувача");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!adminKey) {
      return;
    }
    try {
      await api.delete(`/api/users/${id}`);
      message.success("Користувача видалено");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      message.error("Помилка при видаленні користувача");
    }
  };

  return (
    <AppLayout hasAdminKey={!!adminKey}>
      <div style={{ marginBottom: 32 }}>
        <Title level={4}>Адмін ключ</Title>
        <Text>
          Цей ключ використовується для доступу до backend API. Він має збігатися з{" "}
          <code>ADMIN_API_KEY</code> у backend `.env`.
        </Text>
        <Form
          layout="inline"
          onFinish={handleSaveKey}
          style={{ marginTop: 16, gap: 8, flexWrap: "wrap" }}
          initialValues={{ adminKey: adminKey || "" }}
        >
          <Form.Item name="adminKey" style={{ flex: 1, minWidth: 260 }}>
            <Input.Password placeholder="Введіть ADMIN_API_KEY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingKey}>
              Зберегти
            </Button>
          </Form.Item>
        </Form>
      </div>

      {adminKey ? (
        <>
          <UserForm onSubmit={handleAddUser} loading={addingUser} />
          <Divider />
          <Title level={4}>Whitelist користувачів</Title>
          <UserTable users={users} loading={loadingUsers} onDelete={handleDeleteUser} />
        </>
      ) : (
        <Text type="secondary">
          Щоб працювати з whitelist, спочатку введіть і збережіть валідний ADMIN_API_KEY.
        </Text>
      )}
    </AppLayout>
  );
};

export default App;
