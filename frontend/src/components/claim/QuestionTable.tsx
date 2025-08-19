// src/components/form/QuestionTable.tsx
import React from 'react';
import { RadioQuestion } from './RadioQuestion';
import type { RadioQuestionProps} from './RadioQuestion';
import { TextQuestion } from './TextQuestion';
import type { TextQuestionProps } from './TextQuestion';

interface BaseConfig {
  path: string;
  title: string;
  formatter?: (formData: any, config: any) => string;
}

// 定义更明确的配置项类型
type RadioConfig = BaseConfig & RadioQuestionProps & { type: 'radio' };
type TextConfig = BaseConfig & TextQuestionProps & { type: 'text' | 'textarea' | 'optimizationContext' | 'LegalAnalysisField' };

// 自定义格式化类型
type CustomFormatterConfig = BaseConfig & {
  type: 'custom';
  path: string;
  title: string;
  children?: (path: string) => React.ReactNode;
  formatter: (formData: any, config: any) => string;
  [key: string]: any;
};

// 联合类型
export type QuestionConfig = RadioConfig | TextConfig | CustomFormatterConfig;

interface QuestionTableProps {
  config: QuestionConfig[];
}

export const QuestionTable: React.FC<QuestionTableProps> = ({ config }) => {
  return (
    <table className="table w-full border">
      <tbody>
        {config.map((item) => {
          // 使用 path 作为 key
          const key = item.path;
          
          switch (item.type) {
            case 'radio': {
              // 明确解构，排除 type 属性
              const { type, ...radioProps } = item as RadioConfig;
              return <RadioQuestion key={key} {...radioProps} />;
            }
            case 'textarea':
            case 'optimizationContext':
            case 'LegalAnalysisField': {
              // 明确解构，排除 type 属性
              const { type, ...textProps } = item as TextConfig;
              return <TextQuestion key={key} type={type} {...textProps} />;
            }
            case 'custom': {
              // 自定义类型可以渲染自定义内容
              return (
                <tr key={key} className="hover">
                  <th className="w-1/4 align-top bg-base-200/50">{item.title}</th>
                  <td className="w-3/4">
                    {item.children ? item.children(item.path) : (
                      <div className="text-sm text-gray-600">
                        " "
                      </div>
                    )}
                  </td>
                </tr>
              );
            }
            default:
              return (
                <tr key={key} className="hover">
                  <th className="w-1/4 align-top bg-base-200/50">""</th>
                  <td className="w-3/4">
                        " "
                  </td>
                </tr>
              );
          }
        })}
      </tbody>
    </table>
  );
};