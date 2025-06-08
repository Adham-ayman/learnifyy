import { spawn } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


export const callDeepSeek = async (promptText) => {
  return new Promise((resolve, reject) => {
    const ollamaProcess = spawn('ollama', ['run', 'deepseek-coder:6.7b']);
    
    let output = '';
    let errorOutput = '';
    
    ollamaProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    ollamaProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ollamaProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        console.error('Ollama stderr:', errorOutput);
        reject(new Error(`Ollama exited with code ${code}: ${errorOutput}`));
      }
    });

    ollamaProcess.on('error', (err) => {
      reject(new Error(`Failed to start Ollama: ${err.message}`));
    });

    // Write prompt to stdin and close
    ollamaProcess.stdin.write(promptText);
    ollamaProcess.stdin.end();
  });
};

export const callAI = async (promptText) => {
  // Gemini API first
  try {
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await geminiModel.generateContent(promptText);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (error) {
    if (error.message.includes('Quota exceeded') || error.status === 429) {
      console.warn('Gemini API quota exceeded, falling back to DeepSeek');
      try {
        // Fallback to DeepSeek lw gemeni msht8lsh
        return await callDeepSeek(promptText);
      } catch (deepSeekError) {
        console.error('DeepSeek error:', deepSeekError.message);
        throw new Error(`DeepSeek failed after Gemini quota exceeded: ${deepSeekError.message}`);
      }
    } else {
      console.error('Gemini API error:', error.message);
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }
};