import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Faculty } from './faculty.entity';
import { Rating } from './rating.entity';

@Entity('faculty_assignments')
@Unique(['faculty', 'year', 'semester', 'section', 'branch', 'subject'])
export class FacultyAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column()
  branch: string;

  @Column({ type: 'int', width: 1 })
  year: number;

  @Column({ type: 'int', width: 1 })
  semester: number;

  @Column({ length: 1 })
  section: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Faculty, (faculty) => faculty.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @OneToMany(() => Rating, (rating) => rating.assignment)
  ratings: Rating[];
}
