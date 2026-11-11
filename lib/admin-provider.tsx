"use client";

import React from "react";
import CreateBundleProvider from "@/contexts/bundle/create-bundle-context";
import CreateProductProvider from "@/contexts/product/create-product-context";
import AdminRouteGuard from "@/components/shared/admin-route-gaurd";

const AdminProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminRouteGuard>
      <CreateProductProvider>
        <CreateBundleProvider>{children}</CreateBundleProvider>
      </CreateProductProvider>
    </AdminRouteGuard>
  );
};

export default AdminProviders;
