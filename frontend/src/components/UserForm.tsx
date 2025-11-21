import React from "react";
import { Button, Form, Input, Typography } from "antd";

const { Text } = Typography;

interface UserFormValues {
  username?: string;
  telegramId?: string;
}

interface UserFormProps {
  onSubmit: (values: UserFormValues) => void;
  loading: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm<UserFormValues>();

  const handleFinish = (values: UserFormValues) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 8 }}>Додати користувача</h3>
      <Form
        form={form}
        layout="inline"
        onFinish={handleFinish}
        style={{ gap: 8, flexWrap: "wrap" }}
      >
        <Form.Item name="username" style={{ minWidth: 220 }}>
          <Input placeholder="@username (опційно)" />
        </Form.Item>
        <Form.Item name="telegramId" style={{ minWidth: 220 }}>
          <Input placeholder="telegramId (опційно)" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Додати
          </Button>
        </Form.Item>
      </Form>
      <Text type="secondary">
        Достатньо username або telegramId. Username можна вводити з @ або без, все одно
        буде збережено без @.
      </Text>
    </div>
  );
};
