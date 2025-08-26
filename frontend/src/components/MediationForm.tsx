import React, { useRef } from 'react';

import { useFormContext } from 'react-hook-form';

// --- 单个信息确认项的子组件 ---
const InfoConfirmationRow: React.FC<{ text: string, path: string }> = ({ text, path }) => {
    const { register } = useFormContext();
    return (
        <div className="flex justify-between items-center">
            <p className="text-sm">{text}</p>
            <div className="flex gap-4 flex-shrink-0 ml-4">
                <label className="cursor-pointer gap-2">
                    <input type="radio" {...register(path)} value="了解" className="radio radio-sm checked:text-green-700 mr-1" />
                    <span className="text-sm ">了解</span>
                </label>
                <label className="cursor-pointer gap-2 ">
                    <input type="radio" {...register(path)} value="不了解" className="radio radio-sm checked:text-red-700 mr-1" />
                    <span className="text-sm ">不了解</span>
                </label>
            </div>
        </div>
    )
}

// --- 主组件 ---
export const MediationForm: React.FC<{ path: string }> = ({ path }) => {
    const { register, setValue } = useFormContext();
    const modalRef = useRef<HTMLDialogElement>(null);

    // --- “一键不调解” 按钮的点击处理函数 ---
    const declineAllMediation = () => {
    // 问题1
    setValue(`${path}.q1_understand_mediation_as_method`, '了解', { shouldValidate: true });
    // 问题2 的所有子项
    setValue(`${path}.q2_1_understand_efficiency`, '了解', { shouldValidate: true });
    setValue(`${path}.q2_2_understand_cost`, '了解', { shouldValidate: true });
    setValue(`${path}.q2_3_understand_flexibility`, '了解', { shouldValidate: true });
    setValue(`${path}.q2_4_understand_confidentiality`, '了解', { shouldValidate: true });
    setValue(`${path}.q2_5_understand_legality`, '了解', { shouldValidate: true });
    // 问题3 的最终决定
    setValue(`${path}.q3_final_decision`, '否', { shouldValidate: true });
  };
  
  // --- Modal相关函数 ---
  const openModal = () => {
    modalRef.current?.showModal();
  };

  const handleConfirm = () => {
    declineAllMediation();
    // showModal() 会锁定焦点，需要手动关闭
    modalRef.current?.close();
  };

    return (
        <div>
            <div className="flex justify-end mb-4">
        {/* "一键不调解"按钮现在只负责打开Modal */}
        <button type="button" onClick={openModal} className="btn btn-sm btn-active btn-error text-white">
          一键不调解
        </button>
      </div>

      <dialog id="mediation_confirm_modal" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-red-700">请确认操作</h3>
          <p className="py-4">您确定要将所有调解相关问题设置为“了解”，并最终选择“否”以拒绝调解吗？此操作将覆盖您当前的选择。</p>
          <div className="modal-action">
            <button className="btn" type="button" onClick={() => modalRef.current?.close()}>取消</button>
            <button className="btn btn-active btn-error text-white" type="button" onClick={handleConfirm}>确认</button>
          </div>
        </div>
        {/* 点击背景关闭Modal */}
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
      </dialog>

            <table className="table w-full border">
                <tbody>
                    {/* 第一行：是否了解调解 */}
                    <tr className="hover">
                        <th className="w-1/3 align-top bg-base-200/50">是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷</th>
                        <td className="w-2/3">
                            <InfoConfirmationRow text="" path={`${path}.q1_understand_mediation_as_method`} />
                        </td>
                    </tr>

                    {/* 第二行：了解先行调解的好处 (包含多个子项) */}
                    <tr className="hover">
                        <th className="w-1/3 align-top bg-base-200/50">是否了解先行调解解决纠纷的好处</th>
                        <td className="w-2/3 space-y-4">
                            <InfoConfirmationRow
                                text="1. 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。"
                                path={`${path}.q2_1_understand_efficiency`}
                            />
                            <InfoConfirmationRow
                                text="2. 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。"
                                path={`${path}.q2_2_understand_cost`}
                            />
                            <InfoConfirmationRow
                                text="3. 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。"
                                path={`${path}.q2_3_understand_flexibility`}
                            />
                            <InfoConfirmationRow
                                text="4. 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。"
                                path={`${path}.q2_4_understand_confidentiality`}
                            />
                            <InfoConfirmationRow
                                text="5. 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。"
                                path={`${path}.q2_5_understand_legality`}
                            />
                        </td>
                    </tr>

                    {/* 第三行：是否考虑先行调解 */}
                    <tr className="hover">
                        <th className="w-1/3 align-top bg-base-200/50">是否考虑先行调解</th>
                        <td className="w-2/3 space-y-3">
                            <div className="form-control">
                                <label className="cursor-pointer gap-2">
                                    <input type="radio" {...register(`${path}.q3_final_decision`)} value="是" className="radio checked:text-green-700 mr-1" />
                                    <span className="text-sm">是</span>
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="cursor-pointer gap-2">
                                    <input type="radio" {...register(`${path}.q3_final_decision`)} value="否" className="radio checked:text-red-700 mr-1" />
                                    <span className="text-sm">否</span>
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="cursor-pointer gap-2">
                                    <input type="radio" {...register(`${path}.q3_final_decision`)} value="暂不确定，想要了解更多内容" className="radio checked:text-gray-600 mr-1" />
                                    <span className="text-sm">暂不确定，想要了解更多内容</span>
                                </label>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};