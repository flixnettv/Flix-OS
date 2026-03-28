import axios from 'axios';

// أداة MCP: قراءة ملف من مستودع GitHub
export async function readGithubFile(owner, repo, path) {
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        // فك تشفير المحتوى (لأنه يأتي بصيغة Base64 من GitHub API)
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
