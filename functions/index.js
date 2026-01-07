const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotificationOnCourseUpdate = onDocumentWritten(
  "courses_list/{docId}",
  async (event) => {
    const payload = {
      notification: {
        title: "Course Updated!",
        body: "A new course or update is available.",
      },
    };

    try {
      const tokensSnapshot = await admin
        .firestore()
        .collection("deviceTokens")
        .get();

      if (tokensSnapshot.empty) {
        console.log("No FCM tokens found");
        return null;
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      // Use `sendMulticast` instead of sendToDevice
      const response = await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: payload.notification,
      });

      console.log(
        `Notifications sent successfully! Success: ${response.successCount}, Failure: ${response.failureCount}`
      );

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed token: ${tokens[idx]}, error: ${resp.error}`);
          }
        });
      }

      return response;
    } catch (error) {
      console.error("Error sending notifications:", error);
      return null;
    }
  }
);
