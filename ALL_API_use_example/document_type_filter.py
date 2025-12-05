import requests

BASE_URL = "http://localhost:9621"
API_KEY = None  # 如果需要，填入你的 API Key
HEADERS = {"Content-Type": "application/json"}
if API_KEY:
    HEADERS["X-API-Key"] = API_KEY


def test_filter(file_type=None):
    url = f"{BASE_URL}/documents/paginated"
    payload = {
        "page": 1,
        "page_size": 10,
        "sort_field": "updated_at",
        "sort_direction": "desc",
    }

    if file_type:
        payload["file_type"] = file_type
        print(f"\n📂 正在筛选文件类型: '{file_type}' ...")
    else:
        print("\n📋 获取所有文档 (无类型筛选) ...")

    try:
        response = requests.post(url, json=payload, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            docs = data.get("documents", [])
            print(f"✅ 找到 {len(docs)} 个文档")
            for doc in docs:
                print(f"   - {doc.get('file_path')}")
        else:
            print(f"❌ 请求失败: {response.text}")
    except Exception as e:
        print(f"❌ 错误: {e}")


if __name__ == "__main__":
    test_filter()  # 列出所有
    test_filter("md")  # 只看 Markdown
    test_filter("txt")  # 只看 PDF
    test_filter("docx")  # 只看 PDF
