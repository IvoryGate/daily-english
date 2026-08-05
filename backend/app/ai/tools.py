"""AI 助手工具：定义（OpenAI tool schema）+ 执行器。

工具由 LLM 通过 tool calling 触发，执行结果回填给模型继续生成。
"""

from __future__ import annotations

import json
from typing import Any

import requests
from sqlalchemy.orm import Session

from app.gamification import total_counts
from app.models import Article, Note, User


def tool_definitions() -> list[dict[str, Any]]:
    """给 LLM 的工具声明（OpenAI function calling 格式）。"""
    return [
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "联网搜索，返回相关结果摘要与链接。适用于查询实时信息、补充背景知识。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "搜索关键词"}
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_article",
                "description": "获取本站某篇文章的完整正文，用于分析、总结、讲解语法词汇。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "article_id": {
                            "type": "integer",
                            "description": "文章 ID",
                        }
                    },
                    "required": ["article_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "lookup_word",
                "description": "查单词的中文释义、音标。用于解释生词。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": {"type": "string", "description": "英文单词"}
                    },
                    "required": ["word"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_learning_stats",
                "description": "读取用户的学习统计（阅读数、生词数、复习数、等级、连续打卡等）。",
                "parameters": {"type": "object", "properties": {}},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_note",
                "description": "把一段学习笔记保存到用户的笔记本（可关联某篇文章）。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "笔记内容",
                        },
                        "article_id": {
                            "type": "integer",
                            "description": "可选的关联文章 ID",
                        },
                    },
                    "required": ["content"],
                },
            },
        },
    ]


def execute_tool(name: str, args: dict[str, Any], db: Session, user: User) -> str:
    """执行工具，返回文本结果（回填给 LLM）。"""
    if name == "web_search":
        return _web_search(args.get("query", ""))
    if name == "get_article":
        return _get_article(int(args.get("article_id", 0)), db)
    if name == "lookup_word":
        return _lookup_word(args.get("word", ""))
    if name == "get_learning_stats":
        return _get_stats(db, user)
    if name == "save_note":
        return _save_note(db, user, args)
    return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)


def _web_search(query: str) -> str:
    if not query:
        return json.dumps({"error": "缺少搜索关键词"}, ensure_ascii=False)
    try:
        resp = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return json.dumps({"error": f"搜索失败: {e}"}, ensure_ascii=False)

    results = []
    abstract = data.get("AbstractText") or ""
    if abstract:
        results.append({"type": "摘要", "text": abstract, "url": data.get("AbstractURL", "")})
    for topic in data.get("RelatedTopics", []):
        if "Topics" in topic:  # 嵌套分组
            for sub in topic.get("Topics", []):
                text = sub.get("Text", "")
                if text:
                    results.append({"text": text, "url": sub.get("FirstURL", "")})
        else:
            text = topic.get("Text", "")
            if text:
                results.append({"text": text, "url": topic.get("FirstURL", "")})
        if len(results) >= 6:
            break
    if not results:
        return json.dumps({"note": f"未找到「{query}」的相关结果"}, ensure_ascii=False)
    return json.dumps(results, ensure_ascii=False)


def _get_article(article_id: int, db: Session) -> str:
    article = db.get(Article, article_id)
    if article is None:
        return json.dumps({"error": f"文章 {article_id} 不存在"}, ensure_ascii=False)
    return json.dumps(
        {
            "id": article.id,
            "title": article.title,
            "difficulty": article.difficulty,
            "content": article.content[:3000],  # 限制长度控制 token
        },
        ensure_ascii=False,
    )


def _lookup_word(word: str) -> str:
    try:
        resp = requests.get(
            f"http://localhost:8000/api/dict/{word.strip().lower()}",
            timeout=8,
        )
        if resp.status_code != 200:
            return json.dumps({"error": f"查不到「{word}」"}, ensure_ascii=False)
        return json.dumps(resp.json(), ensure_ascii=False)
    except requests.RequestException as e:
        return json.dumps({"error": f"查词失败: {e}"}, ensure_ascii=False)


def _get_stats(db: Session, user: User) -> str:
    counts = total_counts(db, user)
    return json.dumps(counts, ensure_ascii=False)


def _save_note(db: Session, user: User, args: dict[str, Any]) -> str:
    content = (args.get("content") or "").strip()
    if not content:
        return json.dumps({"error": "笔记内容为空"}, ensure_ascii=False)
    article_id = args.get("article_id")
    note = Note(
        user_id=user.id,
        content=content,
        article_id=article_id if isinstance(article_id, int) else None,
    )
    db.add(note)
    db.commit()
    return json.dumps({"ok": True, "note_id": note.id}, ensure_ascii=False)
