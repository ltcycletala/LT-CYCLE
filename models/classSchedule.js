import mongoose from "mongoose";

const { Schema } = mongoose;

const classScheduleSchema = new Schema(
  {
    dayWeek: { type: String },
    startTime: { type: String },
    date: { type: String },
    bicis: [{}],
    instructorInfo: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Agrega timestamps
  }
);

const ClassSchedule = mongoose.model("ClassSchedule", classScheduleSchema);
export default ClassSchedule;
