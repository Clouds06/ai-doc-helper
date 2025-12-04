import requests

BASE_URL = "http://localhost:9621"
# 如果开启了认证，请设置 API_KEY
API_KEY = None
HEADERS = {"Content-Type": "application/json"}
if API_KEY:
    HEADERS["X-API-Key"] = API_KEY


def search_documents(keyword=None):
    url = f"{BASE_URL}/documents/paginated"
    payload = {
        "page": 1,
        "page_size": 10,
        "sort_field": "updated_at",
        "sort_direction": "desc",
    }

    # 只有当 keyword 存在时才添加到请求中
    if keyword:
        payload["keyword"] = keyword
        print(f"\n🔍 正在搜索关键词: '{keyword}' ...")
    else:
        print("\n📋 正在获取所有文档 (无搜索) ...")

    try:
        response = requests.post(url, json=payload, headers=HEADERS)

        if response.status_code == 200:
            data = response.json()
            docs = data.get("documents", [])
            total = data.get("pagination", {}).get("total_count", 0)

            print(f"✅ 请求成功! 找到 {len(docs)} 条记录 (总计: {total})")

            if len(docs) > 0:
                print("   前 3 个结果:")
                for i, doc in enumerate(docs[:3]):
                    print(f"   {i+1}. ID: {doc['id']}")
                    print(f"      文件: {doc.get('file_path', 'N/A')}")
                    summary = doc.get("content_summary", "")[:50].replace("\n", " ")
                    print(f"      摘要: {summary}...")
            else:
                print("   没有找到匹配的文档。")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"   错误信息: {response.text}")

    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")


if __name__ == "__main__":
    # 1. 先不带关键词查询（确认接口基础功能正常）
    search_documents()

    # 2. 带关键词查询（请替换为你系统中实际存在的词，例如文件名的一部分）
    # 例如：如果你的文件名是 "report_2024.pdf"，可以搜 "report"
    search_term = input("\n请输入要测试的搜索关键词 (按回车跳过): ").strip()
    if search_term:
        search_documents(search_term)
