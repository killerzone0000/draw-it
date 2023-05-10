import { NextResponse } from "next/server";

export const runtime = "edge";

async function createFormData(image: File) {
  const formData = new FormData();
  formData.append("files", image);
  formData.append("prompt", "A modern living room");
  formData.append("mode", "scribble");
  formData.append("numberOfImages", "4");

  return formData;
}

async function postImageToApi(formData: FormData) {
  const modelId = "1e7737d7-545e-469f-857f-e4b46eaa151d";
  const apiUrl = `https://api.tryleap.ai/api/v1/images/models/${modelId}/remix`;

  const response = await fetch(apiUrl, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${process.env.LEAP_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const jsonResponse = await response.json();
  const remixId = jsonResponse.id;

  if (!remixId) {
    throw new Error("Remix ID not found in API response");
  }

  return remixId;
}

export async function POST(request: Request) {
  // Get the incoming image from form data
  console.log("SUBMIT");

  const incomingFormData = await request.formData();
  const image = incomingFormData.get("image") as File | null;

  if (!image) {
    return NextResponse.json(
      { error: "No image found in request" },
      { status: 400 }
    );
  }

  let remixId;
  try {
    const formData = await createFormData(image);
    remixId = await postImageToApi(formData);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Error while making request to external API:",
        error.message
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ remixId });
}
