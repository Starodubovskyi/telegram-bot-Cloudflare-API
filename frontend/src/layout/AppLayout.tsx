import React from "react";
import { Layout, Typography } from "antd";

const { Header, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
  hasAdminKey: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, hasAdminKey }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 24
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          Cloudflare Bot Admin
        </Title>
        {hasAdminKey && (
          <span style={{ color: "#d9f7be", fontSize: 13 }}>Ключ встановлено</span>
        )}
      </Header>
      <Content style={{ padding: 24, maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {children}
      </Content>
    </Layout>
  );
};
