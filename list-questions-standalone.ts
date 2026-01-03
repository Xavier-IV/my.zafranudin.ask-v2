import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
);

// Add the secret key to the headers if it exists
pb.beforeSend = function (url, options) {
  if (process.env.POCKETBASE_SECRET_KEY) {
    options.headers = Object.assign({}, options.headers, {
      "x-secret-key": process.env.POCKETBASE_SECRET_KEY,
    });
  }
  return { url, options };
};

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
