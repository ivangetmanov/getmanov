import re, glob, os

MD_GLOBS = [
    "src/pages/case-studies/**/index.md",
    "src/pages/notes/**/index.md",
    "src/pages/tools/**/index.md",
]

def clean(text: str) -> str:
    # 1) выкинуть тильдо-сущности, которые pandoc иногда оставляет
    text = text.replace("\ufeff", "")  # BOM
    text = re.sub(r"\r\n?", "\n", text)

    # 2) убрать <script>...</script>, <style>...</style>
    text = re.sub(r"<script\b[^>]*>.*?</script>", "", text, flags=re.S | re.I)
    text = re.sub(r"<style\b[^>]*>.*?</style>", "", text, flags=re.S | re.I)

    # 3) убрать on* handlers и style="" у тегов, НО сохранить <img src=...>
    #    (мы удаляем style="..." везде, а у img оставляем только src/alt/title/loading)
    def strip_attrs(match):
        tag = match.group(0)

        if tag.lower().startswith("<img"):
            # оставить src/alt/title/loading/width/height
            src = re.search(r'\bsrc\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)
            alt = re.search(r'\balt\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)
            title = re.search(r'\btitle\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)
            loading = re.search(r'\bloading\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)
            width = re.search(r'\bwidth\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)
            height = re.search(r'\bheight\s*=\s*(".*?"|\'.*?\'|[^\s>]+)', tag, flags=re.I)

            attrs = []
            for m in (src, alt, title, loading, width, height):
                if m: attrs.append(m.group(0).strip())
            return "<img " + " ".join(attrs) + " />"

        # для остальных тегов: выкинуть style="", onClick="", data-*, id/class (они тильдовские)
        tag = re.sub(r'\s+style\s*=\s*(".*?"|\'.*?\')', "", tag, flags=re.I | re.S)
        tag = re.sub(r'\s+on\w+\s*=\s*(".*?"|\'.*?\')', "", tag, flags=re.I | re.S)
        tag = re.sub(r'\s+data-[a-z0-9_-]+\s*=\s*(".*?"|\'.*?\')', "", tag, flags=re.I | re.S)
        tag = re.sub(r'\s+(id|class)\s*=\s*(".*?"|\'.*?\')', "", tag, flags=re.I | re.S)
        return tag

    text = re.sub(r"<img\b[^>]*>", strip_attrs, text, flags=re.I | re.S)
    text = re.sub(r"<(div|span|section|article|header|footer)\b[^>]*>", strip_attrs, text, flags=re.I | re.S)

    # 4) убрать пустые div/span и лишние закрывающие теги (часто остаются)
    text = re.sub(r"<(div|span|section|article)>\s*</\1>", "", text, flags=re.I)
    # 5) убрать тильдо-комментарии
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)

    # 6) нормализовать пути картинок на /images/
    text = text.replace('src="images/', 'src="/images/')
    text = text.replace("src='images/", "src='/images/")
    text = text.replace("](/images//", "](/images/")  # на всякий

    # 7) подчистить слишком много пустых строк
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    # 8) убрать “пустые” заголовки/строки
    text = re.sub(r"^\s+$", "", text, flags=re.M)

    return text.strip() + "\n"

def main():
    files = []
    for g in MD_GLOBS:
        files.extend(glob.glob(g, recursive=True))
    files = sorted(set(files))

    changed = 0
    for f in files:
        old = open(f, "r", encoding="utf-8", errors="ignore").read()
        new = clean(old)
        if new != old:
            open(f, "w", encoding="utf-8").write(new)
            changed += 1

    print(f"✅ Cleaned files: {changed} / {len(files)}")

if __name__ == "__main__":
    main()
