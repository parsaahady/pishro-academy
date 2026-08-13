<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';
require_once dirname(__DIR__) . '/helpers.php';
require_once dirname(__DIR__) . '/media.php';
require_admin();
$method=request_method();
$slug=clean_string($_GET['team'] ?? $_POST['team'] ?? '',50);
if (!valid_slug($slug)) error_response('Invalid team.',422);
$stmt=db()->prepare('SELECT id FROM teams WHERE slug=? LIMIT 1');$stmt->execute([$slug]);$team=$stmt->fetch();if(!$team) error_response('Team not found.',404);
$teamId=(int)$team['id'];$cfg=app_config()['app'];$dir=$cfg['team_gallery_upload_dir'] ?? dirname(__DIR__,2).'/uploads/teams';$url=$cfg['team_gallery_upload_url'] ?? 'uploads/teams';
if($method==='GET'){ $q=db()->prepare('SELECT id,caption,sort_order,created_at,image_path FROM team_gallery_images WHERE team_id=? ORDER BY sort_order,id');$q->execute([$teamId]);$images=array_map(fn($x)=>['id'=>(int)$x['id'],'caption'=>$x['caption'],'sort_order'=>(int)$x['sort_order'],'created_at'=>$x['created_at'],'image_url'=>media_public_url($x['image_path'],'team')],$q->fetchAll());ok_response(['images'=>$images]); }
if($method==='POST'){require_csrf();$caption=clean_string($_POST['caption']??'',280);$image=media_save_upload($_FILES['image']??null,$dir,$url,(int)($cfg['max_upload_bytes']??3*1024*1024));if(!$image)error_response('Image is required.',422);$q=db()->prepare('INSERT INTO team_gallery_images(team_id,image_path,caption,sort_order) VALUES(?,?,?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM (SELECT sort_order FROM team_gallery_images WHERE team_id=?) AS x))');$q->execute([$teamId,$image,$caption?:null,$teamId]);ok_response([],201);}
if($method==='DELETE'){require_csrf();$id=(int)($_GET['id']??0);$q=db()->prepare('SELECT image_path FROM team_gallery_images WHERE id=? AND team_id=?');$q->execute([$id,$teamId]);$row=$q->fetch();if(!$row)error_response('Image not found.',404);db()->prepare('DELETE FROM team_gallery_images WHERE id=?')->execute([$id]);media_remove($row['image_path'],$dir);ok_response();} error_response('Method not allowed.',405);