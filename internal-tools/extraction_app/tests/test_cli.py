import pytest

from cli import main


def test_help_exits_cleanly():
    try:
        main(["--help"])
    except SystemExit as exc:
        assert exc.code == 0


def test_missing_pdf_exits(tmp_path):
    with pytest.raises(SystemExit) as caught:
        main(["mht_cet_2025", str(tmp_path / "missing.pdf"), "-o", str(tmp_path / "out")])
    assert caught.value.code == 2
