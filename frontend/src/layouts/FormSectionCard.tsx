import React from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

export const FormSectionCard: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="card w-full border">
      <div className="card-body">
        <h2 className="card-title text-2xl border-b-2 border-neutral pb-3 mb-6">{title}</h2>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};