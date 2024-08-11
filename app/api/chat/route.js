import { NextResponse } from "next/server"
import OpenAI from "openai"
import { ChatCompletionRunner } from "openai/lib/ChatCompletionRunner"

const systemPrompt =`
Key aspects to highlight:
Education: Pursuing a Bachelor of Arts in Computer Science with a Minor in Mathematics at DePauw University. Consistently recognized on the Dean’s List.
Professional Experience:
Teaching Assistant/ STEM Guide: Involved in designing and teaching a pilot course on the algorithmic foundation of computation.
Software Developer at AV Actions Inc.: Led the development of an internal scheduling and HR platform, and transitioned inventory management systems to the cloud.
Technical Skills: Proficient in Python, Java, JavaScript, React.js, AWS, Microsoft Azure, Git, Firebase, and Docker.
Relevant Coursework: Includes advanced topics such as Data Structures, Advanced Algorithms, and Theory of Computation.
Personal Projects:
Sorting Algorithm Visualizer: A web application that visually demonstrates sorting algorithms and their complexities.
Stock Market Simulator Webapp: A platform simulating stock trades with real-time data integration.
Feel free to ask about his academic achievements, professional experiences, technical skills, or personal projects.`

export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()
   
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", content: systemPrompt}, ...data],
        model: "gpt-4o-mini",
        stream: true,  
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content) {
                        const text= encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err){
                controller.error(err)
            }
            finally{
                controller.close()
            }
        },
    })
    return new NextResponse(stream)    
} 