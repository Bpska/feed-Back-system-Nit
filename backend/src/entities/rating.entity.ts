import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Faculty } from './faculty.entity';
import { FacultyAssignment } from './faculty-assignment.entity';

@Entity('ratings')
@Unique(['student', 'assignment'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', width: 1 })
  engagement_level: number;

  @Column({ type: 'int', width: 1 })
  concept_understanding: number;

  @Column({ type: 'int', width: 1 })
  content_depth: number;

  @Column({ type: 'int', width: 1 })
  application_teaching: number;

  @Column({ type: 'int', width: 1 })
  pedagogy_tools: number;

  @Column({ type: 'int', width: 1 })
  communication_skills: number;

  @Column({ type: 'int', width: 1 })
  class_decorum: number;

  @Column({ type: 'int', width: 1 })
  teaching_aids: number;

  @Column({ type: 'text', nullable: true })
  feedback_message: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Profile, (profile) => profile.ratings)
  @JoinColumn({ name: 'student_id' })
  student: Profile;

  @ManyToOne(() => Faculty, (faculty) => faculty.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @ManyToOne(() => FacultyAssignment, (assignment) => assignment.ratings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignment_id' })
  assignment: FacultyAssignment;
}
