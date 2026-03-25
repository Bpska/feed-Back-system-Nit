import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  read_at: Date;

  @ManyToOne(() => Profile, (profile) => profile.messages)
  @JoinColumn({ name: 'student_id' })
  student: Profile;
}
