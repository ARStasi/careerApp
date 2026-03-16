import os

_INSTRUCTIONS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "assets", "instructions.md"
)


def get_instructions() -> str:
    # Remove the leading "markdown" line if present (artifact from original file)
    with open(_INSTRUCTIONS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    if content.startswith("markdown\n"):
        content = content[len("markdown\n"):]
    return content


def save_instructions(content: str) -> None:
    with open(_INSTRUCTIONS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
