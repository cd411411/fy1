# `forms` 目录开发指南

欢迎来到要素式诉辩状生成平台的表单开发！本文档旨在帮助开发者快速、规范地创建新的起诉状 (`claim`) 和答辩状 (`defense`) 表单页面。

本项目的表单系统基于以下核心组件和理念：

-   **`react-hook-form`**: 用于表单状态管理和验证。
-   **布局组件**: 提供统一的页面结构和功能（如AI辅助、预览、保存草稿）。
-   **原子化表单组件**: 提供标准化的、可复用的输入控件。
-   **配置驱动**: 通过配置数组（`QuestionConfig`）来快速生成要素式表格。

## 快速开始：创建一个新的起诉状页面

假设我们需要创建一个新的“产品责任纠纷”起诉状。

### 第1步：创建表单页面文件

在 `src/forms/claim/` 目录下创建一个新文件：`ProductLiabilityClaimFormPage.tsx`。

### 第2步：复制基础模板

将以下基础模板代码粘贴到新文件中。这是创建一个新表单页面的最小骨架。

```typescript
// src/forms/claim/ProductLiabilityClaimFormPage.tsx

import React from "react";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { MediationForm } from "../../components/MediationForm";
import { BasicInfoSection } from "../../components/BasicInfoSection";
import { QuestionTable } from '../../components/claim/QuestionTable';
import type { QuestionConfig } from '../../components/claim/QuestionTable';
import { createClaimFormatter } from '../../utils/formatter'; // 引入格式化工具

// 1. 定义案件类型 (必须与模板数据库中的'name'一致)
const CASE_TYPE = "产品责任纠纷";

// 2. 定义 "诉讼请求" 的配置
const claimsConfig: QuestionConfig[] = [
    // ... 在这里添加您的诉讼请求配置项 ...
];

// 3. 定义 "事实与理由" 的配置
const factsConfig: QuestionConfig[] = [
    // ... 在这里添加您的事实与理由配置项 ...
];

// 4. 创建数据预览处理器
const processFormDataForPreview = createClaimFormatter(claimsConfig, factsConfig);

// 5. 定义表单主组件
export const ProductLiabilityClaimFormPage: React.FC = () => {
  const title = `民事起诉状 (${CASE_TYPE})`;

  return (
    <FormPageLayout
      title={title}
      formId={`claim_${CASE_TYPE}`} // 唯一的表单ID，用于保存草稿
      docType="起诉状"
      onPreviewData={processFormDataForPreview}
      fixedFormValues={{ basicInfo: { caseCause: CASE_TYPE } }}
    >
      {/* 基础信息 */}
      <BasicInfoSection case_type={CASE_TYPE} />

      {/* 当事人信息 (根据需要增删) */}
      <FormSectionCard title="原告">
        <PartyList path="plaintiffs_natural" title="自然人" partyType="natural" />
        <div className="divider my-4"></div>
        <PartyList path="plaintiffs_legal" title="法人/非法人组织" partyType="legal" />
      </FormSectionCard>

      <AgentList path="agents" />

      <FormSectionCard title="被告">
        <PartyList path="defendants_natural" title="自然人" partyType="natural" />
        <div className="divider my-4"></div>
        <PartyList path="defendants_legal" title="法人/非法人组织" partyType="legal" />
      </FormSectionCard>

      {/* 诉讼请求 */}
      <FormSectionCard title="诉讼请求">
        <QuestionTable config={claimsConfig} />
      </FormSectionCard>

      {/* 事实与理由 */}
      <FormSectionCard title="事实与理由">
        <QuestionTable config={factsConfig} />
      </FormSectionCard>
      
      {/* 其他通用部分 */}
      <FormSectionCard title="对纠纷解决方式的意愿">
        <MediationForm path="mediation" />
      </FormSectionCard>
    </FormPageLayout>
  );
};

export default ProductLiabilityClaimFormPage;
```

### 第3步：配置 `QuestionConfig`

这是开发的核心工作。您需要根据法律要素，在 `claimsConfig` 和 `factsConfig` 数组中定义问题。每个问题都是一个对象，包含以下属性：

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `type` | `'radio'`, `'textarea'`, `'optimizationContext'`, `'LegalAnalysisField'`, `'custom'` | **必需。** 定义了该问题的渲染类型。 |
| `path` | `string` | **必需。** 数据在表单中的存储路径，例如 `claims.c1_payment`。 |
| `title` | `string` | **必需。** 显示在表格左侧的问题标题。 |
| `options`| `Array<{value: string, label: string}>` | `type`为`radio`时必需。定义单选按钮的选项。 |
| `placeholder`| `string` | 可选。输入框或文本域的占位提示文字。 |
| `optimizationContext`| `string` | 可选。为`optimizationContext`或`custom`类型提供给AI的上下文，以获得更精准的优化建议。 |
| `children` | `(path: string) => React.ReactNode` | `type`为`custom`时使用。允许您渲染完全自定义的React组件作为问题的答案部分。 |
| `formatter` | `(formData: any) => string` | `type`为`custom`时**必需**。定义了如何将该问题的表单数据格式化为最终生成Word文档的文本。 |
| `plaintiffRole` / `defendantRole` | `string[]` | (可选) 用于在特定表单中根据用户选择的角色动态显示问题。 |

**示例 - 定义一个简单的诉讼请求：**
```typescript
const claimsConfig: QuestionConfig[] = [
  // 一个带详情的单选问题
  {
    type: "radio",
    path: "claims.c1_return_product",
    title: "1. 是否要求退货",
    options: [{ value: "yes", label: "是" }, { value: "no", label: "否" }],
    enableDetails: true, // 选中"是"后会出现文本框
    detailsLabel: "退货详情",
    detailsPlaceholderTemplate: (title) => `请说明要求退货的具体产品和理由...`,
  },
  // 一个可AI优化的文本域问题
  {
    type: "optimizationContext",
    path: "claims.c2_compensation",
    title: "2. 赔偿损失金额及计算方式",
    placeholder: "请详细说明赔偿金额和具体的计算依据...",
    optimizationContext: "原告关于产品质量问题导致的经济损失赔偿请求"
  },
];
```

### 第4步：注册新页面

1.  **注册表单路由 (`FormContainer.tsx`):**
    在 `src/pages/FormContainer.tsx` 的 `formMap` 对象中，添加新表单的映射。
    ```typescript
    // src/pages/FormContainer.tsx
    const formMap: { [key: string]: LazyComponent } = {
        // ... 其他表单
        'claim-product-liability': lazy(() => import('../forms/claim/ProductLiabilityClaimFormPage')),
    };
    ```

2.  **注册模板信息 (`template_database.ts`):**
    在后端的 `app/templates/template_database.py` 中，为新表单添加一条记录，以便用户可以在模板选择页面看到它。
    ```python
    # app/templates/template_database.py
    "claim": {
        "civil": [
            # ... 其他模板
            {"id": "product-liability", "name": "产品责任纠纷", "path": "/claim/product-liability",
                "description": "适用于因产品缺陷造成人身或财产损害引起的纠纷。", "disabled": False},
        ],
    },
    ```

## 核心布局与组件详解

### 1. `<FormPageLayout>`

这是所有表单页面的根布局组件，它封装了 `react-hook-form` 的 `FormProvider` 和所有通用功能。

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `title` | `string` | **必需。** 显示在页面顶部的完整标题。 |
| `formId` | `string` | **必需。** 一个全局唯一的ID，用于本地草稿的存储和读取。建议格式：`claim_案由` 或 `defense_案由`。 |
| `docType` | `"起诉状"` \| `"答辩状"` | **必需。** 告诉布局当前是哪种文书，影响文档生成逻辑。 |
| `onPreviewData` | `(data: any) => any` | **必需。** 一个函数，负责将 `react-hook-form` 的原始数据 (`data`) 转换成最终生成Word文档所需的 `final_data` 格式。通常由 `createClaimFormatter` 或 `createDefenseFormatter` 生成。 |
| `fixedFormValues` | `object` | 可选。一个对象，用于为表单中的某些字段提供不可更改的默认值。我们用它来固定 `basicInfo.caseCause` 的值。 |
| `leftPanel` / `rightPanel` | `React.ReactNode` | 可选。自定义左右侧边栏的内容。 |

### 2. `<FormSectionCard>`

一个带标题和边框的卡片容器，用于将表单内容按逻辑块（如“原告”、“被告”、“诉讼请求”）进行分组。

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `title` | `string` | **必需。** 显示在卡片顶部的标题。 |
| `children`| `React.ReactNode`| **必需。** 卡片内部的内容。 |

### 3. `<QuestionTable>`

用于快速渲染要素式问答表格的核心组件。

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `config`| `QuestionConfig[]` | **必需。** 一个问题配置对象数组，`QuestionTable` 会根据这个配置来渲染每一行。 |

### 4. `<PartyList>` 和 `<AgentList>`

-   **`<PartyList>`**: 用于处理当事人（原告、被告、第三人）信息。它内置了 `useFieldArray`，允许用户动态添加多个当事人。
    | Prop | 类型 | 说明 |
    | :--- | :--- | :--- |
    | `path` | `string` | **必需。** 当事人数据在表单中的存储路径，例如 `plaintiffs_natural`。 |
    | `title`| `string` | **必需。** 显示在该列表区域的标题，例如“自然人”。 |
    | `partyType` | `"natural"` \| `"legal"` | **必需。** 决定了是渲染自然人表单还是法人表单。 |

-   **`<AgentList>`**: 用于处理委托代理人信息，用法类似。

### 5. `<FormField>` (用于 `custom` 类型的 `QuestionConfig`)

当 `QuestionConfig` 的 `type: 'custom'` 时，您可以在 `children` 中自由地使用 `<FormField>` 这个原子化组件来构建复杂的布局。

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `path` | `string`| **必需。** 表单路径。 |
| `type` | `"text"`, `"number"`, `"date"`, `"radio"`, `"checkbox"`, `"textarea"`, `"select"`, `"money"`, `"optimizable-textarea"`, `"radio_detail"`, `"checkboxGroup"` | **必需。** 输入框类型。 |
| `label`| `string`| 外部标签。 |
| `frontLabel` / `endLabel`| `string`| 内嵌在输入框前后的标签。 |
| `options`| `Array` | 用于 `radio` 和 `select` 等。 |
| ... | | 其他HTML原生属性。 |

**示例：**
```typescript
{
    type: "custom",
    path: "claims.c1_payment",
    title: "1. 支付工程款",
    children: () => (
        <div className="grid grid-cols-2 gap-4">
            <FormField path="claims.c1.amount" type="money" frontLabel="支付工程款" />
            <FormField path="claims.c1.currency" type="radio" options={[{value: 'RMB', label: '人民币'}]} />
        </div>
    ),
    formatter: (formData) => {
        // ...
    }
}
```

## 创建答辩状页面

创建答辩状页面的流程与起诉状**高度相似**，但有几个关键区别：

1.  **文件位置：** 在 `src/forms/defense/` 目录下创建。
2.  **核心组件：** 使用 `GenericDefenseFormPage` 作为基础，它已经封装了大部分答辩状的通用逻辑。
3.  **配置驱动：** 您只需要创建一个 `DefenseFormConfig` 对象，定义好答辩事项和事实与理由的 `QuestionConfig` 即可。

**示例 - 创建“产品责任纠纷”答辩状：**
```typescript
// src/forms/defense/ProductLiabilityDefenseFormPage.tsx

import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import type { DefenseFormConfig } from "../../interfaces/defense-form.types";

// 1. 定义答辩事项
const defenseItemsConfig: QuestionConfig[] = [
    { type: 'objection', path: 'defenses.d1_return_product', title: '对原告“要求退货”的答辩' },
    // ...
];

// 2. 定义事实与理由
const factsAndReasonsConfig: QuestionConfig[] = [
    { type: 'objection', path: 'facts.f1_product_quality', title: '对原告陈述的“产品质量”事实的答辩' },
    // ...
];

// 3. 组合成完整的配置对象
const config: DefenseFormConfig = {
    caseType: "产品责任纠纷",
    title: "民事答辩状 (产品责任纠纷)",
    formId: "defense_product_liability",
    defenseItemsConfig,
    factsAndReasonsConfig,
};

// 4. 导出组件
export const ProductLiabilityDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={config} />;
};

export default ProductLiabilityDefenseFormPage;
```

---

祝您开发愉快！如有任何疑问，请参考现有 `forms` 目录下的其他组件实现。