import json
import os

data = [
    {"id": "divorce", "name": "离婚纠纷", "path": "/defense/divorce",
        "description": "针对离婚诉讼提出的答辩，表明是否同意离婚、财产分割及子女抚养意见。", "disabled": False},
    {"id": "sales-contract", "name": "买卖合同纠纷", "path": "/defense/sales-contract",
        "description": "针对买卖合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "housing-sales-contract", "name": "房屋买卖合同纠纷", "path": "/defense/housing-sales-contract",
        "description": "针对房屋买卖合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "financial-loan-contract", "name": "金融借款合同纠纷", "path": "/defense/financial-loan-contract",
        "description": "针对金融借款合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "private-lending", "name": "民间借贷纠纷", "path": "/defense/private-lending",
        "description": "针对民间借贷纠纷起诉提出的答辩。", "disabled": False},
    {"id": "credit-card", "name": "信用卡纠纷", "path": "/defense/credit-card",
        "description": "针对信用卡纠纷起诉提出的答辩。", "disabled": False},
    {"id": "housing-lease", "name": "房屋租赁合同纠纷", "path": "/defense/housing-lease",
        "description": "针对房屋租赁纠纷起诉提出的答辩。", "disabled": False},
    {"id": "financial-leasing-contract", "name": "融资租赁合同纠纷", "path": "/defense/financial-leasing-contract",
        "description": "针对融资租赁合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "construction-contract", "name": "建设工程施工合同纠纷", "path": "/defense/construction-contract",
        "description": "针对建设工程施工合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "property-management-contract", "name": "物业服务合同纠纷",
        "path": "/defense/property-management-contract", "description": "针对物业服务合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "labor-dispute", "name": "劳动争议纠纷", "path": "/defense/labor-dispute",
        "description": "针对劳动争议纠纷起诉提出的答辩。", "disabled": False},
    {"id": "securities-misrepresentation", "name": "证券虚假陈述责任纠纷",
        "path": "/defense/securities-misrepresentation", "description": "针对证券虚假陈述责任纠纷起诉提出的答辩。", "disabled": False},
    {"id": "property-damage-insurance", "name": "财产损失保险合同纠纷", "path": "/defense/property-damage-insurance",
        "description": "针对财产损失保险合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "liability-insurance", "name": "责任保险合同纠纷", "path": "/defense/liability-insurance",
        "description": "针对责任保险合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "guarantee-insurance", "name": "保证保险合同纠纷", "path": "/defense/guarantee-insurance",
        "description": "针对保证保险合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "personal-insurance", "name": "人身保险合同纠纷", "path": "/defense/personal-insurance",
        "description": "针对人身保险合同纠纷起诉提出的答辩。", "disabled": False},
    {"id": "traffic-accident", "name": "机动车交通事故责任纠纷", "path": "/defense/traffic-accident",
        "description": "针对机动车交通事故责任纠纷起诉提出的答辩。", "disabled": False},
    {"id": "copyright-infringement", "name": "侵害著作权及邻接权纠纷", "path": "/defense/copyright-infringement",
        "description": "针对侵害著作权及邻接权纠纷起诉提出的答辩。", "disabled": False},
    {"id": "trademark-infringement", "name": "侵害商标权纠纷", "path": "/defense/trademark-infringement",
        "description": "针对侵害商标权纠纷起诉提出的答辩。", "disabled": True},
    {"id": "invention-patent-infringement", "name": "侵害发明专利权纠纷",
        "path": "/defense/invention-patent-infringement", "description": "针对侵害发明专利权纠纷起诉提出的答辩。", "disabled": True},
    {"id": "design-patent-infringement", "name": "侵害外观设计专利权纠纷", "path": "/defense/design-patent-infringement",
        "description": "针对侵害外观设计专利权纠纷起诉提出的答辩。", "disabled": True},
    {"id": "plant-variety-rights-infringement", "name": "侵害植物新品种权纠纷",
        "path": "/defense/plant-variety-rights-infringement", "description": "针对侵害植物新品种权纠纷起诉提出的答辩。", "disabled": True},
    {"id": "trade-secret-infringement", "name": "侵害商业秘密纠纷", "path": "/defense/trade-secret-infringement",
        "description": "针对侵害商业秘密纠纷起诉提出的答辩。", "disabled": True},
    {"id": "technology-contract", "name": "技术合同纠纷", "path": "/defense/technology-contract",
        "description": "针对技术合同纠纷起诉提出的答辩。", "disabled": True},
    {"id": "unfair-competition", "name": "不正当竞争纠纷", "path": "/defense/unfair-competition",
        "description": "针对不正当竞争纠纷起诉提出的答辩。", "disabled": False},
    {"id": "monopoly-dispute", "name": "垄断纠纷", "path": "/defense/monopoly-dispute",
        "description": "针对垄断纠纷起诉提出的答辩。", "disabled": True},
    {"id": "ship-collision-damage", "name": "船舶碰撞损害责任纠纷", "path": "/defense/ship-collision-damage",
        "description": "针对船舶碰撞损害责任纠纷起诉提出的答辩。", "disabled": True},
    {"id": "maritime-personal-injury", "name": "海上、通海水域人身损害责任纠纷", "path": "/defense/maritime-personal-injury",
        "description": "针对海上、通海水域人身损害责任纠纷起诉提出的答辩。", "disabled": True},
    {"id": "maritime-freight-forwarding", "name": "海上、通海水域货运代理合同纠纷",
        "path": "/defense/maritime-freight-forwarding", "description": "针对海上、通海水域货运代理合同纠纷起诉提出的答辩。", "disabled": True},
    {"id": "seafarer-labor-contract", "name": "船员劳务合同纠纷", "path": "/defense/seafarer-labor-contract",
        "description": "针对船员劳务合同纠诉提出的答辩。", "disabled": True},
    {"id": "environmental-pollution-public-interest", "name": "环境污染民事公益诉讼",
        "path": "/defense/environmental-pollution-public-interest", "description": "针对环境污染民事公益诉讼起诉提出的答辩。", "disabled": False},
    {"id": "ecological-damage-public-interest", "name": "生态破坏民事公益诉讼",
        "path": "/defense/ecological-damage-public-interest", "description": "针对生态破坏民事公益诉讼起诉提出的答辩。", "disabled": False},
    {"id": "environmental-damage-compensation", "name": "生态环境损害赔偿诉讼",
        "path": "/defense/environmental-damage-compensation", "description": "针对生态环境损害赔偿诉讼起诉提出的答辩。", "disabled": False}
]

def create_empty_json_files(data_list):
    """
    根据给定的数据列表，提取 'id' 并创建对应的空 JSON 文件。
    如果文件已存在，则跳过创建。

    Args:
        data_list (list): 包含字典的列表，每个字典应包含 'id' 键。
    """
    for item in data_list:
        if "id" in item:
            file_id = item["id"]
            file_id = file_id.replace("-", "_")
            file_name = f"defense_{file_id}_structure.json"
            
            if not os.path.exists(file_name):
                try:
                    with open(file_name, 'w', encoding='utf-8') as f:
                        json.dump({}, f, ensure_ascii=False, indent=4)
                    print(f"已创建空文件: {file_name}")
                except IOError as e:
                    print(f"创建文件失败 {file_name}: {e}")
            else:
                print(f"文件已存在，跳过创建: {file_name}")
        else:
            print(f"警告: 发现缺少 'id' 键的项: {item}")

if __name__ == "__main__":
    create_empty_json_files(data)