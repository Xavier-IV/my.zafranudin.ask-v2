import pb from "./src/lib/pocketbase";

async function listQuestions() {
  try {
    const records = await pb.collection("questions").getList(1, 5, {
      filter: "is_published = true",
    });
    console.log("Published Questions:");
    records.items.forEach(record => {
      console.log(`ID: ${record.id}, Question: ${record.question}`);
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
}

listQuestions();
