import unittest

from scripts.deploy_to_hf_space import build_create_repo_payload, resolve_publish_files, resolve_token


class DeployScriptTests(unittest.TestCase):
    def test_build_create_repo_payload(self):
        payload = build_create_repo_payload(
            space_name="demo-space",
            organization="demo-org",
            private=True,
            sdk="gradio",
        )
        self.assertEqual(payload["type"], "space")
        self.assertEqual(payload["name"], "demo-space")
        self.assertEqual(payload["organization"], "demo-org")
        self.assertTrue(payload["private"])
        self.assertEqual(payload["sdk"], "gradio")

    def test_resolve_publish_files_deduplicate(self):
        files = resolve_publish_files(["README.md", "assets/logo.png", "assets/logo.png"])
        self.assertIn("index.html", files)
        self.assertIn("assets/logo.png", files)
        self.assertEqual(files.count("assets/logo.png"), 1)

    def test_resolve_token_priority(self):
        self.assertEqual(resolve_token("abc"), "abc")


if __name__ == "__main__":
    unittest.main()
