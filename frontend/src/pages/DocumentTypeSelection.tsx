import React from 'react';
import { Link, useParams } from 'react-router-dom';

const documentTypes = [
  { name: "民事", category: "civil" },
  { name: "刑事", category: "criminal", disabled: true },
  { name: "行政", category: "administrative", disabled: true },
];

const pageTitles: { [key: string]: string } = {
  claim: "起诉状",
  defense: "答辩状",
  application: "申请书"
};

export const DocumentTypeSelection: React.FC = () => {
  const { docType } = useParams<{ docType: string }>();
  const title = pageTitles[docType || ''] || '文书';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">选择{title}类别</h1>
        <p className="text-lg  mt-2">请选择您的案件所属的法律领域。</p>
      </div>
      <div className="flex flex-col  justify-center gap-4 md:flex-row  items-center">
        {documentTypes.map((type) => (
          <div key={type.category} className={`card w-72 bg-base-100 shadow-xl ${type.disabled ? 'opacity-50' : 'hover:scale-105 transition-transform'}`}>
            <div className="card-body items-center text-center">
              <h2 className="card-title text-3xl">{type.name}</h2>
              <div className="card-actions mt-4">
                <Link to={type.disabled ? '#' : `/select-template/${docType}/${type.category}`} className={`btn btn-primary btn-soft ${type.disabled ? 'btn-disabled' : ''}`}>{type.disabled ? '敬请期待' : '选择'}</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};