import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AuthGuard from "./guards/AuthGuard";
import AppShell from "../providers/ui/AppShell";
import { flags } from "@/shared/config/flags";
import { ROUTES } from "@/shared/config/routerPaths";

// pages (기존)
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/auth/login";
import { SignUpPage } from "@/pages/auth/sign-up";

// pages (신규)
import { ProductSourcingPage } from "@/pages/sourcing/product-sourcing";
import { ChinaImportCalcPage } from "@/pages/sourcing/china-import-calc";

import { DetailPageGeneratorPage } from "@/pages/planning/detail-page-generator";
import { DetailPageScheduledPage } from "@/pages/planning/detail-page-scheduled";
import { ThumbnailGeneratorPage } from "@/pages/planning/thumbnail-generator";
import { ThumbnailScheduledPage } from "@/pages/planning/thumbnail-scheduled";
import { TagGeneratorPage } from "@/pages/planning/tag-generator";

import { RegisteredProductsPage } from "@/pages/products/registered-products";
import { DetailPageGalleryPage } from "@/pages/products/detail-page-gallery";
import { ThumbnailGalleryPage } from "@/pages/products/thumbnail-gallery";

import { ChangePasswordPage } from "@/pages/my/change-password";

const protectedChildren = [
  { path: ROUTES.HOME, element: <HomePage /> },

  // 소싱
  { path: ROUTES.SOURCING_PRODUCTS, element: <ProductSourcingPage /> },
  { path: ROUTES.SOURCING_CHINA_CALC, element: <ChinaImportCalcPage /> },

  // 기획
  { path: ROUTES.PLANNING_DETAIL_PAGE, element: <DetailPageGeneratorPage /> },
  {
    path: ROUTES.PLANNING_DETAIL_PAGE_SCHEDULED,
    element: <DetailPageScheduledPage />,
  },
  { path: ROUTES.PLANNING_THUMBNAIL, element: <ThumbnailGeneratorPage /> },
  {
    path: ROUTES.PLANNING_THUMBNAIL_SCHEDULED,
    element: <ThumbnailScheduledPage />,
  },
  {
    path: ROUTES.PLANNING_TAG_GENERATOR,
    element: <TagGeneratorPage />,
  },

  // 상품
  { path: ROUTES.PRODUCTS_MANAGE, element: <RegisteredProductsPage /> },
  { path: ROUTES.PRODUCTS_DETAIL_PAGES, element: <DetailPageGalleryPage /> },
  { path: ROUTES.PRODUCTS_THUMBNAILS, element: <ThumbnailGalleryPage /> },

  // 마이페이지
  { path: ROUTES.MY_PASSWORD, element: <ChangePasswordPage /> },
];

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      // authEnabled=false면 로그인/회원가입 라우트 자체를 홈으로 리다이렉트
      {
        path: ROUTES.LOGIN,
        element: flags.apiEnabled ? <LoginPage /> : <HomePage />,
      },
      {
        path: ROUTES.SIGNUP,
        element: flags.apiEnabled ? <SignUpPage /> : <HomePage />,
      },

      // 보호 영역
      ...(flags.apiEnabled
        ? [
            {
              element: <AuthGuard />,
              children: protectedChildren,
            },
          ]
        : protectedChildren),

      // { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
