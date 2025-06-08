import { roadmapModel } from "../../../DB/models/roadmap.model.js";
import { userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { callAI } from "../../chat/service/gemini.service.js";



const formatRoadmap = (aiResponse) => {

  try {
    // Try JSON parsing
    let input = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    if (
      input &&
      typeof input.title === 'string' &&
      (typeof input.description === 'string' || input.description === undefined) &&
      Array.isArray(input.subjects) &&
      input.subjects.every(
        (subject) =>
          typeof subject.subjectName === 'string' &&
          typeof subject.order === 'number' &&
          subject.order >= 1
      )
    ) {
      return {
        title: input.title,
        description: input.description || '',
        subjects: input.subjects,
      };
    }
  } catch (jsonError) {
    console.log('JSON Parsing Error:', jsonError.message);
  }

  // Fallback to Markdown parsing
  if (typeof aiResponse === 'string') {
    const normalizedInput = aiResponse.replace(/\r\n/g, '\n').trim();
    let title = '';
    let description = '';
    const subjects = [];

    // Extract title
    const titleMatch = normalizedInput.match(/\*\*Title\*\*:\s*([^\n]*)/i);
    if (titleMatch) title = titleMatch[1].trim();

    // Extract description
    const descMatch = normalizedInput.match(/\*\*Description\*\*:\s*([\s\S]*?)(?=\n##|\n$)/i);
    if (descMatch) description = descMatch[1].trim();

    // Extract subjects
    const subjectSection = normalizedInput.match(/##\s*Subjects\s*([\s\S]*)/i);
    if (subjectSection) {
      const subjectLines = subjectSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('- '));
      subjectLines.forEach((line) => {
        // Relaxed regex to handle variations
        const match = line.match(/-\s*([^\(]+?)\s*\(Order:\s*(\d+)\)/i);
        if (match) {
          const subjectName = match[1].trim();
          const order = parseInt(match[2], 10);
          if (subjectName && order >= 1) {
            subjects.push({ subjectName, order });
          }
        }
      });
    }

    if (title && subjects.length >= 3) {
      return { title, description, subjects };
    }

    // Fallback if partial data
    if (title || subjects.length > 0) {
      return {
        title: title || 'Customized Learning Roadmap',
        description: description || 'An AI-generated roadmap based on your input',
        subjects: subjects.length > 0 ? subjects : [{ subjectName: 'Getting Started', order: 1 }],
      };
    }
  }

  // Error fallback
  console.error('Failed to parse AI response');
  return {
    title: 'Error Roadmap',
    description: 'Error generating roadmap',
    subjects: [{ subjectName: 'Error', order: 1 }],
  };
};

export const generateCustomizedRoadmap = asynchandler(async (req, res, next) => {
  const { customizedCategory, description } = req.body;
  const userId = req.user._id;
  const userName = req.user.userName;

  if (!customizedCategory || !description) {
    return next(new Error('Customized category and description are required', { cause: 400 }));
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  const prompt = `
You are a learning roadmap generator AI. Create a customized roadmap based on the user's input. The response MUST adhere strictly to the following Markdown format, with no additional text, comments, or deviations:

**Title**: [A concise, motivational title for the roadmap]
**Description**: [A brief overview of the roadmap, tailored to the user's prior knowledge, 50-100 words]
## Subjects
- [Subject Name] (Order: [Number])
- [Subject Name] (Order: [Number])
- [Subject Name] (Order: [Number])
...

Requirements:
- Include exactly 3-5 subjects.
- Each subject must have a unique order (starting from 1).
- Subject names should be clear, relevant topics based on the category and user's knowledge.
- The roadmap must be motivational, progressive, and start from the user's current knowledge level.

Category: ${customizedCategory}
User's prior knowledge or preferences: ${description}

Example for category "frontend" and description "I studied HTML":
**Title**: Frontend Development Journey
**Description**: Build on your HTML knowledge to create dynamic, stylish websites. This roadmap guides you through CSS for styling, JavaScript for interactivity, and React for modern interfaces.
## Subjects
- CSS (Order: 1)
- JavaScript (Order: 2)
- React (Order: 3)
`;

  try {
    const aiResponse = await callAI(prompt);
    const formattedRoadmap = formatRoadmap(aiResponse);

    const defaultImage = {
      secure_url: 'https://res.cloudinary.com/dlqvomukl/image/upload/v1749117234/roadmaps/Dod/Web%20Development%20Basics/images/k8tvj7vjyxguofozxf52.png',
      public_id: 'roadmaps/Dod/Web Development Basics/images/k8tvj7vjyxguofozxf52',
    };

    const roadmap = await roadmapModel.create({
      title: formattedRoadmap.title,
      description: formattedRoadmap.description,
      subjects: formattedRoadmap.subjects,
      type: 'customized',
      customizedCategory,
      creator: userId,
      image: defaultImage,
      isActive: true,
    });

    await userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          createdRoadmaps: roadmap._id,
          enrolledRoadmaps: roadmap._id,
        },
      },
      { new: true }
    );

    return sucessResponse({
      res,
      message: 'AI-generated customized roadmap saved and enrolled',
      data: roadmap,
      status: 201,
    });
  } catch (error) {
    return next(new Error(`Failed to generate roadmap: ${error.message}`, { cause: 500 }));
  }
});


// Get all customized roadmaps for the authenticated user
export const getUserCustomizedRoadmaps = asynchandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  const roadmaps = await roadmapModel
    .find({ creator: userId, type: 'customized' })
    .populate('creator', 'userName email');

  return sucessResponse({
    res,
    message: 'User customized roadmaps retrieved successfully',
    data: roadmaps,
    status: 200,
  });
});
