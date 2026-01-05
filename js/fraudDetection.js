function runFraudDetection(fileId, resultId) {
  const file = document.getElementById(fileId).files[0];
  const result = document.getElementById(resultId);

  if (!file) {
    alert("Please upload a file.");
    return;
  }

  result.innerHTML = "🔍 Analyzing document...";

  setTimeout(() => {
    const score = Math.random();

    if (score > 0.25) {
      result.innerHTML = "✅ Approved (Not Fraud)";
      result.style.color = "green";
    } else {
      result.innerHTML = "❌ Fraud Detected";
      result.style.color = "red";
    }
  }, 2000);
}
