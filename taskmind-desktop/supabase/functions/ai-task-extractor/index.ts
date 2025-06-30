import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.0.0';

serve(async (req) => {
  // Ensure only POST requests are handled
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Parse request body
    const { transcript, userId } = await req.json();

    // Initialize Supabase and OpenAI clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    });

    // Use GPT to extract tasks from transcript
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract actionable tasks from the meeting transcript. 
          Format each task with:
          - A clear, concise title
          - Priority (low/medium/high)
          - Optional description or context`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      max_tokens: 300,
    });

    // Parse extracted tasks
    const extractedTasksText = response.choices[0].message.content || '';
    const tasks = extractedTasksText.split('\n')
      .filter(task => task.trim() !== '')
      .map(task => {
        const [titlePart, priorityPart] = task.split('(');
        const title = titlePart.trim();
        const priority = priorityPart 
          ? priorityPart.replace(')', '').trim().toLowerCase() 
          : 'medium';

        return {
          user_id: userId,
          title,
          priority: ['low', 'high'].includes(priority) ? priority : 'medium',
          status: 'todo',
        };
      });

    // Insert tasks into Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      message: 'Tasks extracted and saved', 
      tasksCount: tasks.length 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 