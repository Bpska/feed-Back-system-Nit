import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FacultyAssignment } from './faculty-assignment.entity';
import { Rating } from './rating.entity';

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  department: string;

  @Column({ nullable: true })
  designation: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FacultyAssignment, (assignment) => assignment.faculty)
  assignments: FacultyAssignment[];

  @OneToMany(() => Rating, (rating) => rating.faculty)
  ratings: Rating[];
}
