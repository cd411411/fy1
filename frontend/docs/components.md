# 组件用法

## PretrialPreservationForm

```tsx
import { PretrialPreservationForm } from '../../components/PretrialPreservationForm'; 
import { formatPretrialPreservationForDocx } from '../../utils/formatter'; 

const final: {
    // ...
pretrialPreservation: formatPretrialPreservationForDocx(data),
    // ...
}

<PretrialPreservationForm path="pretrialPreservation" />

```

## 页面注册

pages/FormContainer.tsx

# QuestionTable 组件使用文档

## 概述

QuestionTable 是一个灵活的表单组件系统，用于动态渲染不同类型的问题。它支持单选题、文本输入、以及自定义格式化等多种问题类型。

## 核心组件

### 1. QuestionTable
主容器组件，负责渲染整个问题表格。

**Props:**
- `config: QuestionConfig[]` - 问题配置数组

### 2. RadioQuestion
单选题组件，支持选项选择和详情输入。

**Props:**
- `path: string` - 表单字段路径
- `title: string` - 问题标题
- `options: OptionType[]` - 选项数组
- `children?: (selectedValue: string) => React.ReactNode` - 可选的子组件渲染函数
- `enableDetails?: boolean` - 是否启用详情输入 (默认: false)
- `detailsLabel?: string` - 详情标签 (默认: "明细")
- `detailsPlaceholderTemplate?: (title: string) => string` - 详情占位符模板函数
- `detailsOptimizationContextTemplate?: (title: string) => string` - 详情优化上下文模板函数

### 3. TextQuestion
文本输入组件，支持多种文本输入类型。

**Props:**
- `path: string` - 表单字段路径
- `title: string` - 问题标题
- `type: 'textarea' | 'optimizationContext' | 'LegalAnalysisField'` - 文本输入类型
- `placeholder?: string` - 占位符文本
- `detailsLabel?: string` - 详情标签
- `formDataProcessor?: FormDataProcessor` - 表单数据处理器（仅用于 LegalAnalysisField 类型）

## 配置类型

### RadioConfig
单选题配置

```typescript
type RadioConfig = {
  type: 'radio';
  path: string;
  title: string;
  options: OptionType[];
  enableDetails?: boolean;
  detailsLabel?: string;
  detailsPlaceholderTemplate?: (title: string) => string;
  detailsOptimizationContextTemplate?: (title: string) => string;
}
```

### TextConfig
文本输入配置

```typescript
type TextConfig = {
  type: 'textarea' | 'optimizationContext' | 'LegalAnalysisField';
  path: string;
  title: string;
  placeholder?: string;
  detailsLabel?: string;
  formDataProcessor?: FormDataProcessor;
}
```

### CustomFormatterConfig
自定义格式化配置（仅用于数据格式化，不渲染输入组件）

```typescript
type CustomFormatterConfig = {
  type: 'custom';
  path: string;
  title: string;
  formatter: (formData: any, config: any) => string;
  [key: string]: any;
}
```

## 使用示例

### 基本使用

```typescript
import { QuestionTable } from './components/form/QuestionTable';
import { useForm, FormProvider } from 'react-hook-form';

const MyForm = () => {
  const methods = useForm();
  
  const config = [
    {
      type: 'radio',
      path: 'hasContract',
      title: '是否签订合同',
      options: [
        { value: 'yes', label: '是' },
        { value: 'no', label: '否' }
      ]
    },
    {
      type: 'textarea',
      path: 'description',
      title: '详细描述',
      placeholder: '请输入详细描述...'
    }
  ];

  return (
    <FormProvider {...methods}>
      <form>
        <QuestionTable config={config} />
      </form>
    </FormProvider>
  );
};
```

### 带详情输入的单选题

```typescript
const configWithDetails = [
  {
    type: 'radio',
    path: 'claimDamages_check',
    title: '1. 是否主张损害赔偿',
    options: [
      { value: 'yes', label: '是' },
      { value: 'no', label: '否' }
    ],
    enableDetails: true,
    detailsLabel: '损害赔偿明细',
    detailsPlaceholderTemplate: (title) => `具体${title.replace(/^\d+\.\s*(是否主张)?/, '')}内容...`,
    detailsOptimizationContextTemplate: (title) => `原告关于${title}的具体描述`
  }
];
```

### 不同类型的文本输入

```typescript
const textConfig = [
  {
    type: 'textarea',
    path: 'basicInfo',
    title: '基本信息',
    placeholder: '请输入基本信息...'
  },
  {
    type: 'optimizationContext',
    path: 'legalBasis',
    title: '法律依据',
    placeholder: '请输入法律依据...',
    detailsLabel: '法律依据'
  },
  {
    type: 'LegalAnalysisField',
    path: 'analysis',
    title: '法律分析',
    placeholder: '请输入法律分析...',
    formDataProcessor: (formData) => ({
      // 处理表单数据的逻辑
      processedData: formData
    })
  }
];
```

### 自定义格式化配置

```typescript
const customConfig = [
  {
    type: 'custom',
    path: 'claimsList',
    title: '诉讼请求列表',
    formatter: (formData, config) => {
      const claims = getValueFromPath(formData, config.path);
      if (Array.isArray(claims)) {
        return claims.map((claim, index) => `${index + 1}. ${claim}`).join('\n');
      }
      return '暂无诉讼请求';
    }
  },
  {
    type: 'custom',
    path: 'totalAmount',
    title: '总金额',
    formatter: (formData, config) => {
      const amount1 = getValueFromPath(formData, 'amount1') || 0;
      const amount2 = getValueFromPath(formData, 'amount2') || 0;
      return `${amount1 + amount2}元`;
    }
  }
];
```

## 数据格式化

使用 `formatFormData` 函数将表单数据格式化为问题列表：

```typescript
import { formatFormData } from './utils/formatFormData';

const formData = {
  hasContract: 'yes',
  claimDamages_check: 'yes',
  claimDamages_details: '要求赔偿损失10万元',
  description: '详细的案件描述...'
};

const questionList = formatFormData('claim', formData, config);
// 返回 QuestionListItem[] 格式的数据
```

## 注意事项

1. **表单上下文**: 所有组件都需要在 `FormProvider` 上下文中使用
2. **路径命名**: 启用详情输入的单选题，详情字段路径会自动从 `_check` 替换为 `_details`
3. **类型安全**: 配置对象需要正确指定 `type` 属性以获得类型检查
4. **自定义格式化**: `custom` 类型的配置项仅用于数据格式化，不会渲染输入组件

## 完整示例

```typescript
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { QuestionTable } from './components/form/QuestionTable';
import { formatFormData } from './utils/formatFormData';

const ClaimForm = () => {
  const methods = useForm();
  
  const config = [
    {
      type: 'radio',
      path: 'hasContract_check',
      title: '1. 是否签订合同',
      options: [
        { value: 'yes', label: '是' },
        { value: 'no', label: '否' }
      ],
      enableDetails: true
    },
    {
      type: 'optimizationContext',
      path: 'contractDetails',
      title: '合同详情',
      placeholder: '请描述合同相关情况...',
      detailsLabel: '合同详情'
    },
    {
      type: 'custom',
      path: 'summary',
      title: '案件摘要',
      formatter: (formData) => {
        const hasContract = formData.hasContract_check === 'yes' ? '有合同' : '无合同';
        const details = formData.contractDetails || '无详情';
        return `${hasContract}，详情：${details}`;
      }
    }
  ];

  const handleSubmit = (data) => {
    const formattedData = formatFormData('claim', data, config);
    console.log('格式化后的数据:', formattedData);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)}>
        <QuestionTable config={config} />
        <button type="submit">提交</button>
      </form>
    </FormProvider>
  );
};

export default ClaimForm;
```

## 工具函数

### getValueFromPath
从对象中根据路径获取值的工具函数。

```typescript
const getValueFromPath = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};
```

### generateSelectionText
生成选择文本的工具函数。

```typescript
const generateSelectionText = (options: string[], selectedValue: string): string => {
  // 根据选中值生成对应的文本
  return options.find(option => option === selectedValue) || '';
};
```


## FormField 组件

普通文本输入
```tsx
<FormField path="name" label="姓名" placeholder="请输入姓名" />
```

文本域
```tsx
<FormField path="description" label="描述" type="textarea" rows={4} />
```

下拉选择
```tsx
<FormField 
  path="category" 
  label="分类" 
  type="select" 
  options={[
    { value: 'A', label: '选项A' },
    { value: 'B', label: '选项B' }
  ]} 
/>
```

复选框
```tsx
<FormField path="agree" label="同意条款" type="checkbox" />
```

单选按钮
```tsx
<FormField 
  path="gender" 
  label="性别" 
  type="radio" 
  options={[
    { value: 'male', label: '男' },
    { value: 'female', label: '女' }
  ]} 
/>
```

## 诉前保全模块

只显示诉前保全：
```tsx
<JurisdictionPreservationAppraisalForm 
  path="formData" 
  config={FORM_CONFIGS.PRESERVATION_ONLY}
  title="诉前保全"
/>
```
显示诉前保全和约定管辖：
```tsx
<JurisdictionPreservationAppraisalForm 
  path="formData" 
  config={FORM_CONFIGS.PRESERVATION_AND_JURISDICTION}
  title="约定管辖和诉前保全"
/>
```
显示所有三个部分：
```tsx
<JurisdictionPreservationAppraisalForm 
  path="formData" 
  config={FORM_CONFIGS.ALL}
  title="约定管辖、诉前保全及鉴定申请"
/>
```
